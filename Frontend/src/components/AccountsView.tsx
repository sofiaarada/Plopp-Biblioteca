import { useState, useEffect } from 'react';
import { ShieldCheck, X, Edit, Trash2, UserCog, Eye, EyeOff, Info } from 'lucide-react';
import type { CuentaSistema, CurrentUser } from '../types';
import { api } from '../api';

interface AccountsViewProps {
  userRole?: CurrentUser['rol'];
}

const ROL_CONFIG: Record<string, { label: string; badgeClass: string; color: string }> = {
  admin:        { label: 'Admin',        badgeClass: 'danger',  color: 'var(--danger)'  },
  bibliotecario:{ label: 'Bibliotecario',badgeClass: 'warning', color: 'var(--warning)' },
  usuario:      { label: 'Usuario',      badgeClass: 'success', color: 'var(--success)' },
};

export const AccountsView: React.FC<AccountsViewProps> = ({ userRole = 'admin' }) => {
  const isReadOnly = userRole !== 'admin';
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [cuentas, setCuentas] = useState<CuentaSistema[]>([]);

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correo, setCorreo]               = useState('');
  const [password, setPassword]           = useState('');
  const [rol, setRol]                     = useState<'admin' | 'bibliotecario' | 'usuario'>('usuario');

  const fetchCuentas = async () => {
    try {
      const res  = await api('/cuentas');
      const data = await res.json();
      setCuentas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
    }
  };

  useEffect(() => {
    api('/cuentas')
      .then((response) => response.json())
      .then((data) => setCuentas(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error al obtener cuentas:', error));
  }, []);

  const openModalForCreate = () => {
    if (isReadOnly) return;
    setEditingId(null);
    setNombreUsuario('');
    setCorreo('');
    setPassword('');
    setRol('usuario');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (cuenta: CuentaSistema) => {
    if (isReadOnly) return;
    setEditingId(cuenta.id_cuenta);
    setNombreUsuario(cuenta.nombre_usuario);
    setCorreo(cuenta.correo);
    setPassword('');
    setRol(cuenta.rol);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Eliminar esta cuenta del sistema?')) return;
    try {
      const res = await api(`/eliminarCuenta/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCuentas();
      } else {
        alert('Error al eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const url    = editingId ? `/actualizarCuenta/${editingId}` : '/nuevaCuenta';
    const method = editingId ? 'PUT' : 'POST';

    const body: Record<string, string> = { nombre_usuario: nombreUsuario, correo, rol };
    if (!editingId || password) body.password = password;

    try {
      const res = await api(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchCuentas();
        setIsModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.mensaje ?? 'Error al guardar la cuenta');
      }
    } catch (error) {
      console.error('Error al guardar cuenta:', error);
    }
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <h2>Cuentas del Sistema</h2>
        {!isReadOnly && (
          <button className="btn-primary" onClick={openModalForCreate}>
            <UserCog size={20} />
            <span>Nueva Cuenta</span>
          </button>
        )}
      </div>

      <div className="info-banner">
        <Info size={18} />
        <span>
          Solo el administrador puede crear, editar o eliminar cuentas del sistema.
          Los lectores se registran por su cuenta con su perfil de lector.
        </span>
      </div>

      <div className="data-container">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => {
                const cfg = ROL_CONFIG[cuenta.rol] ?? ROL_CONFIG.usuario;
                const fecha = cuenta.fecha_creacion
                  ? new Date(cuenta.fecha_creacion).toLocaleDateString()
                  : '—';
                return (
                  <tr key={cuenta.id_cuenta}>
                    <td><strong>#{cuenta.id_cuenta}</strong></td>
                    <td>
                      <div className="table-user">
                        <div className="avatar" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>
                          <ShieldCheck size={16} />
                        </div>
                        {cuenta.nombre_usuario}
                      </div>
                    </td>
                    <td>{cuenta.correo}</td>
                    <td>
                      <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                    </td>
                    <td>{fecha}</td>
                    <td>
                      {!isReadOnly && (
                        <div className="action-buttons">
                          <button className="btn-icon text-blue" onClick={() => handleEdit(cuenta)} title="Editar">
                            <Edit size={18} />
                          </button>
                          <button className="btn-icon text-red" onClick={() => handleDelete(cuenta.id_cuenta)} title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Cuenta' : 'Nueva Cuenta del Sistema'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. admin01"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="correo@biblioteca.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{editingId ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                <div className="has-suffix">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                  />
                  <button
                    type="button"
                    className="input-suffix"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Rol del Sistema</label>
                <select
                  className="form-control"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as typeof rol)}
                  required
                >
                  <option value="admin">Admin — Acceso total</option>
                  <option value="bibliotecario">Bibliotecario — Gestión de libros y préstamos</option>
                  <option value="usuario">Usuario — Solo consulta</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Crear'} Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
