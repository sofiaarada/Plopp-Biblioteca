import { useEffect, useState, useRef } from 'react';
import { Send, X, BookOpen, ArrowLeft, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import type { CurrentUser, Mensaje, Conversacion, SocialUser, Libro } from '../types';
import { api, API_URL, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface ChatViewProps {
  currentUser: CurrentUser | null;
  initialChat?: SocialUser | null;
  onClose?: () => void;
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ foto, nombre, size = 38 }: { foto?: string | null; nombre: string; size?: number }) {
  if (foto) return <img src={resolveImageUrl(foto)} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--lime) 0%, var(--navy) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#fff', flexShrink: 0,
    }}>
      {iniciales(nombre)}
    </div>
  );
}

function formatHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, initialChat, onClose }) => {
  const { showToast }                 = useToast();
  const [conversaciones, setConvs]    = useState<Conversacion[]>([]);
  const [chatActivo, setChatActivo]   = useState<SocialUser | null>(initialChat ?? null);
  const [mensajes, setMensajes]       = useState<Mensaje[]>([]);
  const [texto, setTexto]             = useState('');
  const [enviando, setEnviando]       = useState(false);
  const [libros, setLibros]           = useState<Libro[]>([]);
  const [showLibros, setShowLibros]   = useState(false);
  const [libroSel, setLibroSel]       = useState<Libro | null>(null);
  const socketRef   = useRef<Socket | null>(null);
  const endRef      = useRef<HTMLDivElement>(null);

  // Conectar socket
  useEffect(() => {
    if (!currentUser?.id_usuario) return;
    const socket = io(API_URL.replace('/api', ''), {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (currentUser?.id_usuario) {
        socket.emit('registrar', currentUser.id_usuario);
      }
    });

    socket.on('mensaje_nuevo', (msg: Mensaje) => {
      if (chatActivo && (msg.id_emisor === chatActivo.id_usuario || msg.id_receptor === chatActivo.id_usuario)) {
        setMensajes(prev => [...prev, msg]);
      }
      cargarConversaciones();
    });

    return () => {
      socket.off('mensaje_nuevo');
      socket.disconnect();
    };
  }, [currentUser?.id_usuario]);

  const cargarConversaciones = async () => {
    try {
      const res = await api('/chat/conversaciones');
      if (res.ok) setConvs(await res.json());
    } catch { /* ignore */ }
  };

  const cargarMensajes = async (idReceptor: number) => {
    try {
      const [msgsRes, librosRes] = await Promise.all([api(`/chat/${idReceptor}`), api('/libros')]);
      if (msgsRes.ok)   setMensajes(await msgsRes.json());
      if (librosRes.ok) setLibros(await librosRes.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { cargarConversaciones(); }, []);

  useEffect(() => {
    if (chatActivo?.id_usuario) cargarMensajes(chatActivo.id_usuario);
  }, [chatActivo?.id_usuario]);

  // Scroll al final
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async () => {
    if (!texto.trim() || !chatActivo || !currentUser?.id_usuario) return;
    setEnviando(true);
    try {
      const res = await api(`/chat/${chatActivo.id_usuario}`, {
        method: 'POST',
        body: JSON.stringify({ contenido: texto, id_libro_recomendado: libroSel?.id_libro ?? null }),
      });
      if (!res.ok) throw new Error();
      const nuevoMsg: Mensaje = await res.json();
      setMensajes(prev => [...prev, nuevoMsg]);
      // Emitir por socket para tiempo real
      socketRef.current?.emit('mensaje_privado', { idReceptor: chatActivo.id_usuario, mensaje: nuevoMsg });
      setTexto('');
      setLibroSel(null);
      cargarConversaciones();
    } catch {
      showToast('No se pudo enviar el mensaje', 'warning');
    }
    setEnviando(false);
  };

  const miId = currentUser?.id_usuario;

  return (
    <div className="chat-layout">
      {/* ── Panel de conversaciones ── */}
      <div className={`chat-convs ${chatActivo ? 'chat-convs-hidden-mobile' : ''}`}>
        <div className="chat-header">
          <MessageCircle size={20} />
          <h2>Mensajes</h2>
          {onClose && <button className="chat-close-btn" onClick={onClose}><X size={18} /></button>}
        </div>

        {conversaciones.length === 0 ? (
          <div className="chat-empty-convs">
            <MessageCircle size={32} />
            <p>No tienes conversaciones aún.<br/>Busca un lector y envíale un mensaje.</p>
          </div>
        ) : (
          <div className="chat-conv-list">
            {conversaciones.map(c => (
              <button
                key={c.id_usuario}
                className={`chat-conv-item ${chatActivo?.id_usuario === c.id_usuario ? 'active' : ''}`}
                onClick={() => setChatActivo({ id_usuario: c.id_usuario, nombre: c.nombre, foto_url: c.foto_url })}
              >
                <Avatar foto={c.foto_url} nombre={c.nombre} size={44} />
                <div className="chat-conv-info">
                  <strong>{c.nombre}</strong>
                  <span>{c.ultimo_mensaje?.slice(0, 35)}{(c.ultimo_mensaje?.length ?? 0) > 35 ? '…' : ''}</span>
                </div>
                {c.no_leidos > 0 && <span className="chat-badge">{c.no_leidos}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Área de mensajes ── */}
      <div className={`chat-messages-area ${!chatActivo ? 'chat-area-hidden-mobile' : ''}`}>
        {!chatActivo ? (
          <div className="chat-select-placeholder">
            <MessageCircle size={48} />
            <h3>Selecciona una conversación</h3>
            <p>O busca un lector desde la sección Social para iniciar un chat.</p>
          </div>
        ) : (
          <>
            <div className="chat-messages-header">
              <button className="chat-back-btn" onClick={() => setChatActivo(null)}>
                <ArrowLeft size={18} />
              </button>
              <Avatar foto={chatActivo.foto_url} nombre={chatActivo.nombre} size={38} />
              <strong>{chatActivo.nombre}</strong>
            </div>

            <div className="chat-messages-list">
              {mensajes.map((m, i) => {
                const esPropio = m.id_emisor === miId;
                return (
                  <div key={m.id_mensaje ?? i} className={`chat-bubble-wrap ${esPropio ? 'own' : ''}`}>
                    {m.libro_titulo && (
                      <div className="chat-book-rec">
                        <BookOpen size={12} />
                        <span>Recomendación: <strong>{m.libro_titulo}</strong>{m.libro_autor ? ` · ${m.libro_autor}` : ''}</span>
                      </div>
                    )}
                    <div className={`chat-bubble ${esPropio ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
                      {m.contenido}
                    </div>
                    <span className="chat-bubble-time">{formatHora(m.fecha)}</span>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Libro recomendado seleccionado */}
            {libroSel && (
              <div className="chat-book-chip">
                <BookOpen size={13} />
                <span>{libroSel.titulo}</span>
                <button onClick={() => setLibroSel(null)}><X size={11} /></button>
              </div>
            )}

            {showLibros && (
              <div className="chat-book-picker">
                {libros.slice(0, 20).map(l => (
                  <button
                    key={l.id_libro}
                    className="chat-book-option"
                    onClick={() => { setLibroSel(l); setShowLibros(false); }}
                  >
                    <BookOpen size={13} />
                    <span>{l.titulo}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-input-area">
              <button
                className="chat-attach-btn"
                title="Recomendar libro"
                onClick={() => setShowLibros(v => !v)}
              >
                <BookOpen size={18} />
              </button>
              <input
                type="text"
                className="chat-input"
                placeholder="Escribe un mensaje..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                maxLength={1000}
              />
              <button
                className="chat-send-btn"
                onClick={enviar}
                disabled={enviando || !texto.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
