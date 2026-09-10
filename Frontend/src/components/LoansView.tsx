import { useState, useEffect } from 'react';
import { PlusCircle, X, Edit, Trash2, Search, BookOpen, Undo2 } from 'lucide-react';
import type { CurrentUser, Libro, Usuario, Prestamo } from '../types';
import { api } from '../api';

interface LoansViewProps {
  currentUser?: CurrentUser | null;
}

export const LoansView: React.FC<LoansViewProps> = ({ currentUser = null }) => {
  const isReadOnly = currentUser?.rol === 'usuario';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
    
  // Estados para guardar los datos traídos de la base de datos
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'prestados' | 'devueltos'>('prestados');
  const [busquedaUsuarioModal, setBusquedaUsuarioModal] = useState('');

  // Estados para el formulario
  const [idUsuario, setIdUsuario] = useState('');
  const [idLibro, setIdLibro] = useState('');
  const [fechaPrestamo, setFechaPrestamo] = useState(new Date().toISOString().split('T')[0]);
  const [estadoPrestamo, setEstadoPrestamo] = useState('Activo');

  // ==========================================
  // OBTENER TODOS LOS DATOS (GET)
  // ==========================================
  const fetchDatos = async () => {
    try {
      // Usamos Promise.all para hacer las 3 peticiones al mismo tiempo
      const [resPrestamos, resUsuarios, resLibros] = await Promise.all([
        api('/prestamos'),
        api('/usuarios'),
        api('/libros')
      ]);

      setPrestamos(await resPrestamos.json());
      setUsuarios(await resUsuarios.json());
      setLibros(await resLibros.json());
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  useEffect(() => {
    Promise.all([api('/prestamos'), api('/usuarios'), api('/libros')])
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then(([prestamosData, usuariosData, librosData]) => {
        setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
        setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
        setLibros(Array.isArray(librosData) ? librosData : []);
      })
      .catch((error) => console.error('Error al obtener datos:', error));
  }, []);

  const openModalForCreate = () => {
    if (isReadOnly) return;
    setEditingId(null);
    setIdUsuario('');
    setIdLibro('');
    setFechaPrestamo(new Date().toISOString().split('T')[0]);
    setEstadoPrestamo('Activo');
    setBusquedaUsuarioModal('');
    setIsModalOpen(true);
  };

  const handleEdit = (prestamo: Prestamo) => {
    if (isReadOnly) return;
    setEditingId(prestamo.id_prestamo);
    setIdUsuario(prestamo.id_usuario ? prestamo.id_usuario.toString() : '');
    setIdLibro(prestamo.id_libro ? prestamo.id_libro.toString() : '');
    setFechaPrestamo(prestamo.fecha_prestamo ? prestamo.fecha_prestamo.split('T')[0] : '');
    setEstadoPrestamo(prestamo.estado);
    const usuarioEdit = usuarios.find(u => u.id_usuario === prestamo.id_usuario);
    setBusquedaUsuarioModal(usuarioEdit ? `${usuarioEdit.nombre} — ${usuarioEdit.cedula || ''}` : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este préstamo?')) return;
    try {
      const response = await api(`/eliminarPrestamo/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchDatos();
      } else {
        alert("Error al eliminar el préstamo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const fechaDevolucion = new Date(fechaPrestamo);
    fechaDevolucion.setDate(fechaDevolucion.getDate() + 14);

    const url = editingId 
      ? `/actualizarPrestamo/${editingId}`
      : '/nuevoPrestamo';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await api(url, {
        method: method,
        body: JSON.stringify({ 
          id_usuario: idUsuario, 
          id_libro: idLibro,
          fecha_prestamo: fechaPrestamo,
          fecha_devolucion: fechaDevolucion.toISOString().split('T')[0],
          estado: estadoPrestamo
        }),
      });

      if (response.ok) {
        fetchDatos(); 
        setIsModalOpen(false);
        setIdUsuario('');
        setIdLibro('');
        setEditingId(null);
      } else {
        alert("Error al guardar el préstamo");
      }
    } catch (error) {
      console.error("Error al guardar préstamo:", error);
    }
  };

  const handleReturn = async (prestamo: Prestamo) => {
    if (!window.confirm(`¿Devolver "${prestamo.librosPrestados}"?`)) return;
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const loanRes = await api(`/actualizarPrestamo/${prestamo.id_prestamo}`, {
        method: 'PUT',
        body: JSON.stringify({
          id_usuario: prestamo.id_usuario,
          id_libro: prestamo.id_libro,
          fecha_prestamo: prestamo.fecha_prestamo,
          fecha_devolucion: hoy,
          estado: 'Devuelto'
        }),
      });
      if (!loanRes.ok) throw new Error('No se pudo registrar la devolución');

      const bookRes = await api(`/actualizarLibro/${prestamo.id_libro}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: prestamo.librosPrestados,
          autor: prestamo.autor,
          categoria: prestamo.categoria,
          anio: prestamo.anio,
          estado: 'Disponible',
          portada: prestamo.portada,
          descripcion: prestamo.descripcion
        }),
      });
      if (!bookRes.ok) throw new Error('La devolución se registró pero no se pudo actualizar el libro');

      fetchDatos();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo completar la devolución');
    }
  };

  const prestamosDelUsuario = currentUser?.rol === 'usuario'
    ? prestamos.filter(prestamo => prestamo.id_usuario === currentUser.id_usuario)
    : prestamos;

  const prestamosPorEstado = isReadOnly && filtroEstado !== 'todos'
    ? prestamosDelUsuario.filter(prestamo => filtroEstado === 'devueltos'
      ? prestamo.estado === 'Devuelto'
      : prestamo.estado !== 'Devuelto')
    : prestamosDelUsuario;

  const prestamosFiltrados = busqueda.trim()
    ? prestamosPorEstado.filter(p => {
        const texto = busqueda.trim().toLowerCase();
        return (
          (p.librosPrestados && p.librosPrestados.toLowerCase().includes(texto)) ||
          (p.nombreUsuario && p.nombreUsuario.toLowerCase().includes(texto)) ||
          (p.cedulaUsuario && p.cedulaUsuario.includes(texto))
        );
      })
    : prestamosPorEstado;

  const formatearFecha = (fecha: string | null) => fecha
    ? new Date(fecha).toLocaleDateString('es-CO')
    : 'Pendiente';

  return (
    <div className="view-container">
      <div className="page-header">
        <h2>{isReadOnly ? 'Mis préstamos' : 'Control de Préstamos'}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              type="text"
              placeholder={isReadOnly ? 'Buscar entre mis libros...' : 'Buscar por nombre o cédula...'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px', width: '260px', height: '38px' }}
            />
          </div>
          {!isReadOnly && (
            <button className="btn-primary" onClick={openModalForCreate}>
              <PlusCircle size={20} />
              <span>Registrar Préstamo</span>
            </button>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="loan-status-tabs" role="tablist" aria-label="Filtrar mis préstamos">
          {[
            ['prestados', 'Prestados'],
            ['devueltos', 'Devueltos'],
            ['todos', 'Todos'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filtroEstado === value}
              className={filtroEstado === value ? 'active' : ''}
              onClick={() => setFiltroEstado(value as 'todos' | 'prestados' | 'devueltos')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isReadOnly ? (
        <div className="loan-book-grid">
          {prestamosFiltrados.map((prestamo) => (
            <article className="loan-book-card" key={prestamo.id_prestamo}>
              {prestamo.portada ? (
                <img className="loan-book-cover" src={prestamo.portada} alt={`Portada de ${prestamo.librosPrestados}`} />
              ) : (
                <div className="loan-book-cover loan-book-cover-empty"><BookOpen size={30} /><span>Sin portada</span></div>
              )}
              <div className="loan-book-content">
                <h3>{prestamo.librosPrestados}</h3>
                <p className="book-author">{prestamo.autor || 'Autor no registrado'}</p>
                <div className="loan-book-meta">
                  <span>{prestamo.categoria || 'Sin categoría'}</span>
                  {prestamo.anio && <span>{prestamo.anio}</span>}
                </div>
                {prestamo.descripcion && <p className="loan-book-description">{prestamo.descripcion}</p>}
                <div className="loan-book-dates">
                  <div><small>Lo prestaste</small><strong>{formatearFecha(prestamo.fecha_prestamo)}</strong></div>
                  <div><small>Debes devolverlo</small><strong>{formatearFecha(prestamo.fecha_devolucion)}</strong></div>
                </div>
                <span className={`badge ${prestamo.estado === 'Devuelto' ? 'success' : prestamo.estado === 'Activo' ? 'warning' : 'danger'}`}>
                  {prestamo.estado === 'Devuelto' ? 'Devuelto' : prestamo.estado === 'Vencido' ? 'Vencido' : 'Prestado'}
                </span>
                {prestamo.estado !== 'Devuelto' && (
                  <button type="button" className="btn-plopp-primary loan-return-btn" onClick={() => handleReturn(prestamo)}>
                    <Undo2 size={16} />
                    Devolver
                  </button>
                )}
              </div>
            </article>
          ))}
          {prestamosFiltrados.length === 0 && <p className="loan-empty">No hay libros en este historial.</p>}
        </div>
      ) : (
      <div className="data-container">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID Préstamo</th>
                {!isReadOnly && <th>Usuario</th>}
                <th>Libros</th>
                <th>Fecha Préstamo</th>
                <th>Devolución</th>
                <th>Estado</th>
                {!isReadOnly && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {prestamosFiltrados.map((prestamo) => {
                return (
                  <tr key={prestamo.id_prestamo}>
                    <td><strong>#{prestamo.id_prestamo}</strong></td>
                    {!isReadOnly && (
                      <td>
                        <div>{prestamo.nombreUsuario}</div>
                        <small style={{ opacity: 0.6, fontSize: '0.8em' }}>C.C. {prestamo.cedulaUsuario || '—'} · {prestamo.correoUsuario}</small>
                      </td>
                    )}
                    <td>{prestamo.librosPrestados}</td>
                    <td>{formatearFecha(prestamo.fecha_prestamo)}</td>
                    <td>{formatearFecha(prestamo.fecha_devolucion)}</td>
                    <td>
                      <span className={`badge ${
                        prestamo.estado === 'Devuelto' ? 'success' : 
                        prestamo.estado === 'Activo' ? 'warning' : 'danger'
                      }`}>
                        {prestamo.estado}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon text-blue" onClick={() => handleEdit(prestamo)} title="Editar">
                            <Edit size={18} />
                          </button>
                          <button className="btn-icon text-red" onClick={() => handleDelete(prestamo.id_prestamo)} title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Préstamo' : 'Registrar Préstamo'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Usuario (Lector) — Buscar por nombre o cédula</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', opacity: 0.5 }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escriba nombre o número de cédula..."
                    value={busquedaUsuarioModal}
                    onChange={(e) => {
                      setBusquedaUsuarioModal(e.target.value);
                      if (idUsuario) setIdUsuario('');
                    }}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
                {busquedaUsuarioModal.trim() && !idUsuario && (
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    marginTop: '6px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                  }}>
                    {usuarios
                      .filter(u => {
                        const texto = busquedaUsuarioModal.trim().toLowerCase();
                        return (
                          u.nombre.toLowerCase().includes(texto) ||
                          (u.cedula && u.cedula.includes(texto))
                        );
                      })
                      .map(u => (
                        <div
                          key={u.id_usuario}
                          onClick={() => {
                            setIdUsuario(u.id_usuario.toString());
                            setBusquedaUsuarioModal(`${u.nombre} — C.C. ${u.cedula || 'Sin cédula'}`);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                          <small style={{ opacity: 0.6 }}>C.C. {u.cedula || '—'} · {u.correo}</small>
                        </div>
                      ))}
                    {usuarios.filter(u => {
                      const texto = busquedaUsuarioModal.trim().toLowerCase();
                      return u.nombre.toLowerCase().includes(texto) || (u.cedula && u.cedula.includes(texto));
                    }).length === 0 && (
                      <div style={{ padding: '12px 14px', opacity: 0.5, textAlign: 'center' }}>
                        No se encontraron usuarios
                      </div>
                    )}
                  </div>
                )}
                {idUsuario && (
                  <small style={{ color: 'var(--success)', marginTop: '4px', display: 'block' }}>
                    ✓ Usuario seleccionado (ID #{idUsuario})
                  </small>
                )}
                <input type="hidden" value={idUsuario} required />
              </div>
              <div className="form-group">
                <label>Libro a Prestar {editingId && '(Opcional al editar)'}</label>
                <select 
                  className="form-control" 
                  value={idLibro}
                  onChange={(e) => setIdLibro(e.target.value)}
                  required={!editingId}
                >
                  <option value="">Seleccione un libro disponible...</option>
                  {libros.map(l => (
                    <option key={l.id_libro} value={l.id_libro}>{l.titulo} ({l.autor})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Préstamo</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={fechaPrestamo}
                  onChange={(e) => setFechaPrestamo(e.target.value)}
                  required 
                />
              </div>
              {editingId && (
                <div className="form-group">
                  <label>Estado del Préstamo</label>
                  <select 
                    className="form-control"
                    value={estadoPrestamo}
                    onChange={(e) => setEstadoPrestamo(e.target.value)}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Devuelto">Devuelto</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Confirmar'} Préstamo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
