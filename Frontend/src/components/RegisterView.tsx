import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { CurrentUser } from '../types';
import { api } from '../api';
import { PasswordStrength, isPasswordSecure } from './PasswordStrength';
import { SocialAuthButtons } from './SocialAuthButtons';

interface RegisterViewProps {
  onBack: () => void;
  onRegistered: (user: CurrentUser) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBack, onRegistered }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isPasswordSecure(password)) {
      setError('Tu contraseña todavía no cumple los requisitos de seguridad.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api('/nuevoUsuario', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, telefono, cedula, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.mensaje || 'No se pudo registrar el lector');
        return;
      }

      const user: CurrentUser = {
        id_cuenta: null,
        id_usuario: data.id_nuevo_usuario,
        nombre_usuario: nombre,
        correo,
        rol: 'usuario',
      };

      onRegistered(user);
    } catch (error) {
      console.error('Error al registrar lector:', error);
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="plopp-auth-page plopp-auth-page-register">
      <span className="plopp-blob blob-navy blob-1" />
      <span className="plopp-blob blob-lavender blob-2" />
      <span className="plopp-blob blob-lavender blob-3" />
      <span className="plopp-blob blob-navy blob-4" />

      <div className="plopp-auth-shell plopp-auth-shell-single">
        <div className="plopp-mobile-mascot" aria-hidden="true">
          <img src="/mascots/mascota-libro.png" alt="" />
        </div>
        <div className="plopp-auth-card plopp-register-card">
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={16} />
            Volver
          </button>

          <h1>Únete a<br />Plopp Library</h1>
          <p className="plopp-auth-subtitle">Crea tu perfil de lector y empieza a coleccionar historias.</p>

          <form onSubmit={handleSubmit} className="plopp-auth-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input
                id="nombre"
                type="text"
                className="form-control plopp-input"
                placeholder="Ej. Ana Torres"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registroCorreo">Email</label>
              <input
                id="registroCorreo"
                type="email"
                className="form-control plopp-input"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </div>

            <div className="plopp-form-row">
              <div className="form-group">
                <label htmlFor="registroTelefono">Teléfono</label>
                <input
                  id="registroTelefono"
                  type="tel"
                  className="form-control plopp-input"
                  placeholder="3001234567"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="registroCedula">N. Cédula</label>
                <input
                  id="registroCedula"
                  type="text"
                  className="form-control plopp-input"
                  placeholder="1002003004"
                  value={cedula}
                  onChange={(event) => setCedula(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="registroPassword">Contraseña</label>
              <input
                id="registroPassword"
                type="password"
                className="form-control plopp-input"
                placeholder="Crea tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <PasswordStrength value={password} />
            </div>

            <div className="form-group">
              <label htmlFor="registroConfirm">Confirmar contraseña</label>
              <input
                id="registroConfirm"
                type="password"
                className="form-control plopp-input"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-plopp-primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>

          <div className="plopp-divider"><span>o regístrate con</span></div>
          <SocialAuthButtons onAuthenticated={onRegistered} />

          <div className="auth-note">
            Las cuentas del sistema (admin y bibliotecario) solo las crea el administrador.
            Aquí solo registras tu perfil de lector.
          </div>
        </div>
      </div>
    </div>
  );
};
