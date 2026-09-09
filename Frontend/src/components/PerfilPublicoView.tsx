import { useEffect, useState } from 'react';
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, Star, BookOpen, Heart } from 'lucide-react';
import type { CurrentUser, SocialUser, FeedPublicacion, Resena, ListaLectura } from '../types';
import { api, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface PerfilPublicoViewProps {
  currentUser: CurrentUser | null;
  idUsuario: number;
  onBack: () => void;
  onOpenChat?: (user: SocialUser) => void;
}

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < Math.round(valor) ? 'var(--lime)' : 'none'} color={i < Math.round(valor) ? 'var(--lime)' : 'var(--text-muted)'} />
      ))}
    </div>
  );
}

type Perfil = SocialUser & {
  publicaciones: FeedPublicacion[];
  resenas: (Resena & { titulo: string; autor: string; portada?: string | null })[];
};

export const PerfilPublicoView: React.FC<PerfilPublicoViewProps> = ({ currentUser, idUsuario, onBack, onOpenChat }) => {
  const { showToast }              = useToast();
  const [perfil, setPerfil]        = useState<Perfil | null>(null);
  const [lista, setLista]          = useState<ListaLectura[]>([]);
  const [tab, setTab]              = useState<'publicaciones' | 'resenas' | 'leidos'>('publicaciones');
  const [cargando, setCargando]    = useState(true);
  const esPropio = currentUser?.id_usuario === idUsuario;

  useEffect(() => {
    setCargando(true);
    Promise.all([
      api(`/social/perfil/${idUsuario}`),
      api(`/lista-lectura/${idUsuario}`),
    ]).then(async ([pRes, lRes]) => {
      if (pRes.ok) setPerfil(await pRes.json());
      if (lRes.ok) setLista(await lRes.json());
    }).catch(() => {}).finally(() => setCargando(false));
  }, [idUsuario]);

  const toggleSeguir = async () => {
    if (!perfil) return;
    const yoSigo = !!perfil.yo_sigo;
    try {
      const res = await api(`/social/seguir/${idUsuario}`, { method: yoSigo ? 'DELETE' : 'POST' });
      if (!res.ok) throw new Error();
      setPerfil(prev => prev ? {
        ...prev,
        yo_sigo: !yoSigo,
        seguidores: (prev.seguidores ?? 0) + (yoSigo ? -1 : 1),
      } : null);
      showToast(yoSigo ? 'Dejaste de seguir a este usuario' : `¡Ahora sigues a ${perfil.nombre}!`, 'success');
    } catch {
      showToast('No se pudo realizar la acción', 'warning');
    }
  };

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  if (!perfil) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>No se pudo cargar el perfil.</p>
      <button className="btn-primary" onClick={onBack}>Volver</button>
    </div>
  );

  return (
    <div className="perfil-publico">
      {/* Header de navegación */}
      <button className="back-link" onClick={onBack} style={{ marginBottom: 20 }}>
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Tarjeta de perfil */}
      <div className="perfil-publico-card">
        <div className="perfil-publico-avatar">
          {perfil.foto_url
            ? <img src={resolveImageUrl(perfil.foto_url)} alt={perfil.nombre} />
            : <div className="perfil-avatar-initials">{iniciales(perfil.nombre)}</div>
          }
        </div>

        <div className="perfil-publico-info">
          <h1>{perfil.nombre}</h1>
          {perfil.bio && <p className="perfil-bio">{perfil.bio}</p>}

          {/* Stats */}
          <div className="perfil-stats-row">
            <div className="perfil-stat">
              <strong>{perfil.seguidores ?? 0}</strong>
              <span>Seguidores</span>
            </div>
            <div className="perfil-stat">
              <strong>{perfil.seguidos ?? 0}</strong>
              <span>Siguiendo</span>
            </div>
            <div className="perfil-stat">
              <strong>{perfil.total_resenas ?? 0}</strong>
              <span>Reseñas</span>
            </div>
            <div className="perfil-stat">
              <strong>{perfil.libros_leidos ?? 0}</strong>
              <span>Leídos</span>
            </div>
          </div>

          {/* Acciones (solo si no es tu propio perfil) */}
          {!esPropio && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                className={`social-follow-btn ${perfil.yo_sigo ? 'following' : ''}`}
                onClick={toggleSeguir}
                style={{ padding: '8px 18px' }}
              >
                {perfil.yo_sigo ? <UserCheck size={15} /> : <UserPlus size={15} />}
                {perfil.yo_sigo ? 'Siguiendo' : 'Seguir'}
              </button>
              <button
                className="social-btn-ghost"
                onClick={() => onOpenChat?.({ id_usuario: perfil.id_usuario, nombre: perfil.nombre, foto_url: perfil.foto_url })}
                style={{ padding: '8px 18px' }}
              >
                <MessageCircle size={15} /> Mensaje
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="perfil-tabs">
        {(['publicaciones', 'resenas', 'leidos'] as const).map(t => (
          <button
            key={t}
            className={`perfil-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'publicaciones' ? 'Publicaciones' : t === 'resenas' ? 'Reseñas' : 'Leídos'}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div className="perfil-tab-content">
        {tab === 'publicaciones' && (
          perfil.publicaciones.length === 0 ? (
            <div className="perfil-empty">Sin publicaciones aún</div>
          ) : (
            <div className="perfil-pub-grid">
              {perfil.publicaciones.map(p => (
                <div key={p.id_publicacion} className="perfil-pub-card">
                  {p.titulo && (
                    <div className="perfil-pub-book">
                      <BookOpen size={12} />
                      <span>{p.titulo}</span>
                    </div>
                  )}
                  <p>{p.contenido}</p>
                  <span className="perfil-pub-likes">
                    <Heart size={13} fill="currentColor" color="#ef4444" /> {p.total_likes}
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'resenas' && (
          perfil.resenas.length === 0 ? (
            <div className="perfil-empty">Sin reseñas aún</div>
          ) : (
            <div className="perfil-resenas-grid">
              {perfil.resenas.map(r => (
                <div key={r.id_resena} className="perfil-resena-card">
                  {r.portada
                    ? <img src={resolveImageUrl(r.portada)} alt={r.titulo} />
                    : <div className="perfil-resena-placeholder"><BookOpen size={20} /></div>
                  }
                  <Estrellas valor={r.calificacion} />
                  <strong>{r.titulo}</strong>
                  <span>{r.autor}</span>
                  {r.comentario && <p>{r.comentario.slice(0, 80)}{r.comentario.length > 80 ? '…' : ''}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'leidos' && (
          lista.length === 0 ? (
            <div className="perfil-empty">Aún no ha marcado libros como leídos</div>
          ) : (
            <div className="perfil-resenas-grid">
              {lista.map(l => (
                <div key={l.id} className="perfil-resena-card">
                  {l.portada
                    ? <img src={resolveImageUrl(l.portada)} alt={l.titulo} />
                    : <div className="perfil-resena-placeholder"><BookOpen size={20} /></div>
                  }
                  <strong>{l.titulo}</strong>
                  <span>{l.autor}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
