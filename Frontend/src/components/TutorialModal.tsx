import { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, Star, X } from 'lucide-react';
import type { CurrentUser } from '../types';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const stepsByRole: Record<CurrentUser['rol'], TutorialStep[]> = {
  admin: [
    { icon: <LayoutDashboard size={26} />, title: 'Tu panel de control', text: 'Desde "Resumen" ves gráficos de préstamos, compras virtuales y actividad general de la biblioteca.' },
    { icon: <BookOpen size={26} />, title: 'Libros e inventario', text: 'Agrega, edita o elimina libros y controla el stock disponible en "Libros".' },
    { icon: <Users size={26} />, title: 'Usuarios y cuentas', text: 'Gestiona lectores en "Usuarios" y crea cuentas de bibliotecario o admin en "Cuentas".' },
    { icon: <Star size={26} />, title: '¡Listo!', text: 'Ya puedes administrar Plopp Library de principio a fin. Puedes volver a ver este tutorial desde el menú.' },
  ],
  bibliotecario: [
    { icon: <LayoutDashboard size={26} />, title: 'Tu panel', text: 'Consulta préstamos pendientes y el estado general de la biblioteca al entrar.' },
    { icon: <BookOpen size={26} />, title: 'Préstamos y libros', text: 'Aprueba o rechaza solicitudes de préstamo y mantén al día el catálogo de libros.' },
    { icon: <Users size={26} />, title: 'Lectores', text: 'Consulta y actualiza los datos de los lectores registrados.' },
    { icon: <Star size={26} />, title: '¡Listo!', text: 'Ya conoces lo esencial. Puedes volver a ver este tutorial desde el menú cuando quieras.' },
  ],
  usuario: [
    { icon: <BookOpen size={26} />, title: 'Explora el catálogo', text: 'Busca libros disponibles y solicita tu préstamo con un clic.' },
    { icon: <Star size={26} />, title: 'Comunidad', text: 'Reseña los libros que leas, comparte recomendaciones y descubre qué leen otros usuarios.' },
    { icon: <Users size={26} />, title: 'Tu perfil', text: 'Agrega tu foto y una breve bio para que la comunidad te conozca.' },
    { icon: <LayoutDashboard size={26} />, title: '¡Listo!', text: '¡A disfrutar de tu mundo de lectura! Puedes volver a ver este tutorial desde el menú.' },
  ],
};

interface TutorialModalProps {
  role: CurrentUser['rol'];
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ role, onClose }) => {
  const [step, setStep] = useState(0);
  const steps = stepsByRole[role];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)' }}
          aria-label="Cerrar tutorial"
        >
          <X size={18} />
        </button>
        <div className="tutorial-icon">{current.icon}</div>
        <h2 style={{ marginBottom: 8 }}>{current.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{current.text}</p>

        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <span key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>

        <div className="tutorial-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            Atrás
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          >
            {isLast ? 'Empezar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};
