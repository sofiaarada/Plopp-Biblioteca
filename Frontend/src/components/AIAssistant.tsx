import { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import type { CurrentUser } from '../types';

interface Message {
  from: 'bot' | 'user';
  text: string;
}

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const faqByRole: Record<CurrentUser['rol'], FaqEntry[]> = {
  admin: [
    { keywords: ['libro', 'agregar', 'crear'], answer: 'Ve a "Libros" y pulsa "Nuevo libro". Ahí defines título, autor, categoría, año, estado y portada.' },
    { keywords: ['usuario', 'lector'], answer: 'En "Usuarios" puedes ver, editar o eliminar los lectores registrados.' },
    { keywords: ['cuenta', 'rol', 'bibliotecario', 'permiso'], answer: 'Solo el administrador crea cuentas de bibliotecario o admin, desde la sección "Cuentas".' },
    { keywords: ['grafico', 'estadistica', 'dashboard'], answer: 'El "Resumen" muestra préstamos por mes, compras virtuales y actividad general en gráficos.' },
    { keywords: ['prestamo'], answer: 'En "Préstamos" apruebas, rechazas y das seguimiento a cada solicitud.' },
  ],
  bibliotecario: [
    { keywords: ['prestamo', 'aprobar', 'rechazar'], answer: 'En "Préstamos" ves las solicitudes pendientes y puedes aprobarlas o rechazarlas.' },
    { keywords: ['libro', 'stock', 'inventario'], answer: 'Desde "Libros" gestionas el catálogo y el estado (disponible, prestado, mantenimiento) de cada ejemplar.' },
    { keywords: ['usuario', 'lector'], answer: 'Puedes consultar los datos de los lectores en "Usuarios".' },
  ],
  usuario: [
    { keywords: ['prestar', 'pedir', 'solicitar', 'prestamo'], answer: 'Entra a "Libros", elige uno disponible y toca "Solicitar Préstamo".' },
    { keywords: ['reseña', 'calificar', 'estrella', 'opinar'], answer: 'En "Comunidad" elige "Reseñar un libro", pon tu calificación en estrellas y comparte tu opinión.' },
    { keywords: ['perfil', 'foto', 'bio'], answer: 'En "Perfil" puedes subir tu foto y escribir una breve bio para que la comunidad te conozca.' },
    { keywords: ['comunidad', 'compartir', 'recomendar'], answer: 'En "Comunidad" puedes publicar qué estás leyendo y ver lo que otros lectores recomiendan.' },
  ],
};

const suggestionsByRole: Record<CurrentUser['rol'], string[]> = {
  admin: ['¿Cómo agrego un libro?', '¿Cómo veo las estadísticas?', '¿Cómo creo una cuenta?'],
  bibliotecario: ['¿Cómo apruebo un préstamo?', '¿Cómo edito el stock?'],
  usuario: ['¿Cómo pido un libro prestado?', '¿Cómo dejo una reseña?', '¿Cómo cambio mi foto?'],
};

function responder(pregunta: string, role: CurrentUser['rol']): string {
  const texto = pregunta.toLowerCase();
  const entry = faqByRole[role].find((f) => f.keywords.some((k) => texto.includes(k)));
  if (entry) return entry.answer;
  return 'Todavía estoy aprendiendo esa 🙂. Prueba con una de las preguntas sugeridas o explora el menú lateral — cada sección tiene lo que necesitas.';
}

interface AIAssistantProps {
  role: CurrentUser['rol'];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ role }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: '¡Hola! Soy el asistente de Plopp Library. Pregúntame cómo usar la app 📚' },
  ]);

  const enviar = (texto: string) => {
    if (!texto.trim()) return;
    setMessages((m) => [...m, { from: 'user', text: texto }, { from: 'bot', text: responder(texto, role) }]);
    setInput('');
  };

  return (
    <>
      {open && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-header">
            <Sparkles size={16} />
            Asistente Plopp
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit' }}
              aria-label="Cerrar asistente"
            >
              <X size={16} />
            </button>
          </div>
          <div className="ai-assistant-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.from === 'bot' ? 'ai-msg-bot' : 'ai-msg-user'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="ai-assistant-suggestions">
            {suggestionsByRole[role].map((s) => (
              <button key={s} type="button" className="ai-suggestion-chip" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="ai-assistant-input">
            <input
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar(input)}
            />
            <button type="button" onClick={() => enviar(input)} aria-label="Enviar">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button type="button" className="ai-assistant-bubble" onClick={() => setOpen((v) => !v)} aria-label="Abrir asistente">
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </>
  );
};
