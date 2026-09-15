import { useState } from 'react';
import { UserCheck, Phone, IdCard } from 'lucide-react';
import type { CurrentUser } from '../types';
import { api } from '../api';
import { useToast } from './Toast';

interface CompletarPerfilModalProps {
  currentUser: CurrentUser;
  onCompleted: (user: CurrentUser) => void;
}

export const CompletarPerfilModal: React.FC<CompletarPerfilModalProps> = ({ currentUser, onCompleted }) => {
  const { showToast } = useToast();
  const [cedula, setCedula] = useState(currentUser.cedula && !String(currentUser.cedula).startsWith('google-') ? currentUser.cedula : '');
  const [telefono, setTelefono] = useState(currentUser.telefono ?? '');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim() || !telefono.trim()) {
      showToast('La cédula y el teléfono son obligatorios', 'warning');
      return;
    }
    setGuardando(true);
    try {
      const res = await api('/auth/completarPerfil', {
        method: 'PUT',
        body: JSON.stringify({ cedula: cedula.trim(), telefono: telefono.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error');

      const actualizado: CurrentUser = {
        ...currentUser,
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        perfilIncompleto: false,
        token: data.token ?? currentUser.token,
      };
      showToast('Perfil completado. ¡Bienvenido!', 'success');
      onCompleted(actualizado);
    } catch {
      showToast('No se pudo completar el perfil', 'warning');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content completar-perfil-modal">
        <div className="modal-header">
          <div>
            <span className="reader-eyebrow">Bienvenido a Plopp</span>
            <h3><UserCheck size={20} /> Completa tu perfil</h3>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
          {currentUser.nombre_usuario}, para terminar tu registro de lector necesitamos tu documento y teléfono.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><IdCard size={14} /> Número de documento</label>
            <input
              type="text"
              className="form-control"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Tu número de cédula"
              required
            />
          </div>
          <div className="form-group">
            <label><Phone size={14} /> Número de teléfono</label>
            <input
              type="tel"
              className="form-control"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Tu número de teléfono"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-plopp-primary" disabled={guardando} style={{ width: '100%' }}>
              {guardando ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
