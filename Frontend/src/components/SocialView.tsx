import { useEffect, useState, useRef } from 'react';
import { Heart, MessageCircle, Search, UserPlus, UserCheck, BookOpen, Send, X } from 'lucide-react';
import type { CurrentUser, FeedPublicacion, SocialUser, Libro } from '../types';
import { api, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface SocialViewProps {
  currentUser: CurrentUser | null;
  onOpenChat?: (user: SocialUser) => void;
  onOpenProfile?: (idUsuario: number) => void;
  onNavigate?: (view: string) => void;
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Avatar({ foto, nombre, size = 40 }: { foto?: string | null; nombre: string; size?: number }) {
  if (foto) return <img src={foto} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
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

function timeAgo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export const SocialView: React.FC<SocialViewProps> = ({ currentUser, onOpenChat, onOpenProfile, onNavigate }) => {
  const { showToast } = useToast();
  const [feed, setFeed]         = useState<FeedPublicacion[]>([]);
  const [sugerencias, setSugerencias] = useState<SocialUser[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<SocialUser[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // Publicar
  const [textoPub, setTextoPub]   = useState('');
  const [libroSel, setLibroSel]   = useState<Libro | null>(null);
  const [libros, setLibros]       = useState<Libro[]>([]);
  const [showLibros, setShowLibros] = useState(false);
  const [enviando, setEnviando]   = useState(false);
  const busquedaTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cargarFeed = async () => {
    setCargando(true);
    try {
      const [feedRes, librosRes] = await Promise.all([
        api('/social/feed'),
        api('/libros'),
      ]);
      if (feedRes.ok)   setFeed(await feedRes.json());
      if (librosRes.ok) setLibros(await librosRes.json());
    } catch { /* ignore */ }
    setCargando(false);
  };

  const cargarSugerencias = async () => {
    try {
      const res = await api('/social/buscar?q=');
      if (res.ok) {
        const data: SocialUser[] = await res.json();
        setSugerencias(data.filter(u => !u.yo_sigo).slice(0, 5));
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    cargarFeed();
    cargarSugerencias();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return; }
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await api(`/social/buscar?q=${encodeURIComponent(busqueda)}`);
        if (res.ok) setResultados(await res.json());
      } catch { /* ignore */ }
      setBuscando(false);
    }, 400);
  }, [busqueda]);

  const toggleSeguir = async (idUsuario: number, yoSigo: boolean) => {
    try {
      const method = yoSigo ? 'DELETE' : 'POST';
      const res = await api(`/social/seguir/${idUsuario}`, { method });
      if (!res.ok) throw new Error();
      showToast(yoSigo ? 'Dejaste de seguir a este usuario' : '¡Ahora sigues a este usuario!', 'success');
      // Actualizar feed y sugerencias
      setSugerencias(prev => prev.map(u => u.id_usuario === idUsuario ? { ...u, yo_sigo: !yoSigo } : u));
      setResultados(prev => prev.map(u => u.id_usuario === idUsuario ? { ...u, yo_sigo: !yoSigo } : u));
      if (!yoSigo) cargarFeed(); // recargar feed al seguir alguien nuevo
    } catch {
      showToast('No se pudo procesar la acción', 'warning');
    }
  };

  const toggleLike = async (idPublicacion: number) => {
    try {
      const res = await api(`/social/like/${idPublicacion}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const { liked } = await res.json();
      setFeed(prev => prev.map(p =>
        p.id_publicacion === idPublicacion
          ? { ...p, yo_di_like: liked ? 1 : 0, total_likes: p.total_likes + (liked ? 1 : -1) }
          : p
      ));
    } catch { /* ignore */ }
  };

  const publicar = async () => {
    if (!textoPub.trim()) return;
    setEnviando(true);
    try {
      const res = await api('/nuevaPublicacion', {
        method: 'POST',
        body: JSON.stringify({
          contenido: textoPub,
          id_usuario: currentUser?.id_usuario,
          id_libro: libroSel?.id_libro ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      setTextoPub('');
      setLibroSel(null);
      showToast('Publicación compartida con éxito', 'success');
      cargarFeed();
    } catch {
      showToast('No se pudo publicar', 'warning');
    }
    setEnviando(false);
  };

  const librosOrdenados = libros
    .filter(l => !libroSel || l.id_libro !== libroSel.id_libro)
    .slice(0, 30);

  return (
    <div className="social-layout">
      {/* ── Columna central (feed) ── */}
      <div className="social-main">

        {/* Pestañas de alternancia entre Red Social y Foro */}
        {onNavigate && (
          <div className="community-subnav">
            <button
              type="button"
              className="subnav-pill active"
              aria-current="page"
            >
              <span>Red Social</span>
            </button>
            <button
              type="button"
              className="subnav-pill"
              onClick={() => onNavigate('foro')}
            >
              <span>Foro de Comunidad</span>
            </button>
          </div>
        )}

        {/* Caja de publicación */}
        <div className="social-post-box">
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar foto={null} nombre={currentUser?.nombre_usuario || 'Yo'} size={42} />
            <textarea
              className="social-post-input"
              placeholder="¿Qué estás leyendo? Comparte con la comunidad..."
              value={textoPub}
              onChange={e => setTextoPub(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {libroSel && (
            <div className="social-post-book-chip">
              <BookOpen size={14} />
              <span>{libroSel.titulo}</span>
              <button onClick={() => setLibroSel(null)}><X size={12} /></button>
            </div>
          )}

          <div className="social-post-actions">
            <button
              type="button"
              className="social-btn-ghost"
              onClick={() => setShowLibros(v => !v)}
            >
              <BookOpen size={16} /> Adjuntar libro
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{textoPub.length}/500</span>
            <button
              type="button"
              className="btn-plopp-primary"
              style={{ padding: '8px 20px', fontSize: 14 }}
              onClick={publicar}
              disabled={enviando || !textoPub.trim()}
            >
              <Send size={14} /> {enviando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>

          {showLibros && (
            <div className="social-book-picker">
              {librosOrdenados.map(l => (
                <button
                  key={l.id_libro}
                  className="social-book-option"
                  onClick={() => { setLibroSel(l); setShowLibros(false); }}
                >
                  {l.portada
                    ? <img src={resolveImageUrl(l.portada)} alt={l.titulo} />
                    : <div className="social-book-option-placeholder"><BookOpen size={14} /></div>
                  }
                  <div>
                    <p>{l.titulo}</p>
                    <span>{l.autor}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        {cargando ? (
          <div className="social-loading">
            {[1,2,3].map(i => <div key={i} className="social-skeleton" />)}
          </div>
        ) : feed.length === 0 ? (
          <div className="social-empty">
            <div className="social-empty-icon" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <BookOpen size={48} />
            </div>
            <h3>Tu feed está vacío</h3>
            <p>Sigue a otros lectores para ver sus publicaciones y reseñas aquí.</p>
          </div>
        ) : (
          <div className="social-feed">
            {feed.map(pub => (
              <div key={pub.id_publicacion} className="social-card">
                <div className="social-card-header">
                  <button
                    className="social-user-btn"
                    onClick={() => onOpenProfile?.(pub.id_usuario)}
                  >
                    <Avatar foto={pub.foto_url} nombre={pub.nombre_usuario} size={40} />
                    <div>
                      <strong>{pub.nombre_usuario}</strong>
                      <span>{timeAgo(pub.fecha)}</span>
                    </div>
                  </button>
                  {pub.id_usuario !== currentUser?.id_usuario && (
                    <button
                      className="social-btn-ghost"
                      onClick={() => onOpenChat?.({ id_usuario: pub.id_usuario, nombre: pub.nombre_usuario, foto_url: pub.foto_url })}
                    >
                      <MessageCircle size={14} /> Mensaje
                    </button>
                  )}
                </div>

                {pub.titulo && (
                  <div className="social-card-book">
                    {pub.portada
                      ? <img src={resolveImageUrl(pub.portada)} alt={pub.titulo} />
                      : <div className="social-card-book-placeholder"><BookOpen size={20} /></div>
                    }
                    <div>
                      <strong>{pub.titulo}</strong>
                      <span>{pub.autor}</span>
                    </div>
                  </div>
                )}

                <p className="social-card-content">{pub.contenido}</p>

                <div className="social-card-footer">
                  <button
                    className={`social-like-btn ${pub.yo_di_like ? 'liked' : ''}`}
                    onClick={() => toggleLike(pub.id_publicacion)}
                  >
                    <Heart size={16} fill={pub.yo_di_like ? 'currentColor' : 'none'} />
                    <span>{pub.total_likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Columna lateral (búsqueda + sugerencias) ── */}
      <aside className="social-sidebar">
        {/* Buscador */}
        <div className="social-search-box">
          <div className="social-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar lectores..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && <button onClick={() => { setBusqueda(''); setResultados([]); }}><X size={14} /></button>}
          </div>

          {resultados.length > 0 && (
            <div className="social-search-results">
              {resultados.map(u => (
                <UserCard
                  key={u.id_usuario}
                  user={u}
                  onSeguir={() => toggleSeguir(u.id_usuario, !!u.yo_sigo)}
                  onChat={() => onOpenChat?.(u)}
                  onProfile={() => onOpenProfile?.(u.id_usuario)}
                />
              ))}
            </div>
          )}
          {buscando && <p style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Buscando...</p>}
        </div>

        {/* Sugerencias */}
        {sugerencias.length > 0 && (
          <div className="social-suggestions">
            <h3>Lectores que quizás conozcas</h3>
            {sugerencias.map(u => (
              <UserCard
                key={u.id_usuario}
                user={u}
                onSeguir={() => toggleSeguir(u.id_usuario, !!u.yo_sigo)}
                onChat={() => onOpenChat?.(u)}
                onProfile={() => onOpenProfile?.(u.id_usuario)}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

// ── Tarjeta de usuario reutilizable ─────────────────────────────────────────
function UserCard({ user, onSeguir, onChat, onProfile }: {
  user: SocialUser;
  onSeguir: () => void;
  onChat:   () => void;
  onProfile: () => void;
}) {
  return (
    <div className="social-user-card">
      <button className="social-user-btn" onClick={onProfile}>
        {user.foto_url
          ? <img src={user.foto_url} alt={user.nombre} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--lime) 0%, var(--navy) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}>
              {user.nombre.slice(0,2).toUpperCase()}
            </div>
        }
        <div>
          <strong>{user.nombre}</strong>
          {user.seguidores !== undefined && <span>{user.seguidores} seguidores</span>}
        </div>
      </button>
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
        <button className="social-btn-ghost" title="Mensaje" onClick={onChat}>
          <MessageCircle size={14} />
        </button>
        <button
          className={`social-follow-btn ${user.yo_sigo ? 'following' : ''}`}
          onClick={onSeguir}
        >
          {user.yo_sigo ? <UserCheck size={14} /> : <UserPlus size={14} />}
          {user.yo_sigo ? 'Siguiendo' : 'Seguir'}
        </button>
      </div>
    </div>
  );
}
