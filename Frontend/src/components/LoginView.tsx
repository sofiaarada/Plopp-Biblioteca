import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { CurrentUser } from '../types';
import { api, setToken } from '../api';
import { SocialAuthButtons } from './SocialAuthButtons';

interface LoginViewProps {
  onLogin: (user: CurrentUser) => void;
  onBack: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.mensaje || 'Credenciales incorrectas');
        return;
      }

      setToken(data.token ?? null);

      const user = {
        ...(data.usuario as CurrentUser),
        token: data.token ?? null,
      };
      onLogin(user);
    } catch (error) {
      console.error('Error en login:', error);
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="plopp-auth-page">
      <span className="plopp-blob blob-lime blob-1" />
      <span className="plopp-blob blob-navy blob-2" />
      <span className="plopp-blob blob-lavender blob-3" />
      <span className="plopp-blob blob-lime blob-4" />

      <div className="plopp-auth-shell">
        <div className="plopp-auth-mascot-panel">
          <button type="button" className="back-link back-link-light" onClick={onBack}>
            <ArrowLeft size={16} />
            Volver
          </button>
          <img
            src="/mascots/mascota-libro.png"
            alt="Mascota de Plopp Library"
            className="plopp-mascot-side"
          />
        </div>

        <div className="plopp-auth-card">
          <h1>Plopp Library<br />Login</h1>
          <p className="plopp-auth-subtitle">Tu mundo de lectura te espera.</p>

          <form onSubmit={handleSubmit} className="plopp-auth-form">
            <div className="form-group">
              <label htmlFor="correo">Email</label>
              <input
                id="correo"
                type="email"
                className="form-control plopp-input"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="plopp-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control plopp-input"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="plopp-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="plopp-forgot">¿Olvidaste tu contraseña?</span>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-plopp-primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : "Let's Plopp!"}
            </button>
          </form>

          <div className="plopp-divider"><span>o continúa con</span></div>
          <SocialAuthButtons onAuthenticated={onLogin} />
        </div>
      </div>
    </div>
  );
};
