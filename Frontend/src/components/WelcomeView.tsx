import React from 'react';

interface WelcomeViewProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onGoToLogin, onGoToRegister }) => {
  return (
    <div className="plopp-welcome">
      <span className="plopp-blob blob-lime blob-1" />
      <span className="plopp-blob blob-navy blob-2" />
      <span className="plopp-blob blob-lavender blob-3" />
      <span className="plopp-blob blob-lime blob-4" />

      <div className="plopp-welcome-content">
        <img
          src="/mascots/welcomeplopp.png"
          alt="Mascota de Plopp Library leyendo un libro"
          className="plopp-mascot"
        />

        <h1 className="plopp-welcome-title">¡Bienvenido a<br />Plopp Library!</h1>
        <p className="plopp-welcome-subtitle">Tu mundo de lectura, ahora en cualquier dispositivo.</p>

        <div className="plopp-welcome-actions">
          <button type="button" className="btn-plopp-primary" onClick={onGoToLogin}>
            Iniciar Sesión
          </button>
          <button type="button" className="btn-plopp-outline" onClick={onGoToRegister}>
            Crear Cuenta
          </button>
        </div>
      </div>
    </div>
  );
};
