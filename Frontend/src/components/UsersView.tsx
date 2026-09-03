import { useState, useEffect } from 'react';
import { UserPlus, X, Edit, Trash2, Search } from 'lucide-react';
import type { Usuario } from '../types';
import { api } from '../api';

export const UsersView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaCedula, setBusquedaCedula] = useState('');

  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');


  const fetchUsuarios = async () => {
    try {
      
      const response = await api('/usuarios');
      const data = await response.json(); 
      
      
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  
  useEffect(() => {
    api('/usuarios')
      .then((response) => response.json())
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error al obtener usuarios:', error));
  }, []);

  
  const usuariosFiltrados = busquedaCedula.trim()
    ? usuarios.filter(u => u.cedula && u.cedula.includes(busquedaCedula.trim()))
    : usuarios;

  const openModalForCreate = () => {
    setEditingId(null);
    setNombre('');
    setCedula('');
    setCorreo('');
    setTelefono('');
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id_usuario);
    setNombre(usuario.nombre);
    setCedula(usuario.cedula || '');
    setCorreo(usuario.correo);
    setTelefono(usuario.telefono);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    try {
      const response = await api(`/eliminarUsuario/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchUsuarios();
      } else {
        alert("Error al eliminar el usuario");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    const url = editingId 
      ? `/actualizarUsuario/${editingId}`
      : '/nuevoUsuario';
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await api(url, {
        method: method,
        body: JSON.stringify({ nombre, cedula, correo, telefono }),
      });

      if (response.ok) {
        fetchUsuarios();
        setIsModalOpen(false);
        setNombre('');
        setCedula('');
        setCorreo('');
        setTelefono('');
        setEditingId(null);
      } else {
        alert("Hubo un error al guardar en la base de datos");
      }
    } catch (error) {
      console.error("Error al enviar usuario:", error);
    }
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Buscar por cédula..."
              value={busquedaCedula}
              onChange={(e) => setBusquedaCedula(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px', width: '220px', height: '38px' }}
            />
          </div>
          <button className="btn-primary" onClick={openModalForCreate}>
            <UserPlus size={20} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="data-container">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td><strong>#{usuario.id_usuario}</strong></td>
                  <td><code style={{ fontSize: '0.9em', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>{usuario.cedula || '—'}</code></td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.correo}</td>
                  <td>{usuario.telefono}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-blue" onClick={() => handleEdit(usuario)} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon text-red" onClick={() => handleDelete(usuario.id_usuario)} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Juan Pérez" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Número de Cédula</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. 1234567890" 
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="ejemplo@correo.com" 
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="Ej. 300-123-4567" 
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Guardar'} Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
