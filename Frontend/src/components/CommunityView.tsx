import { useEffect, useState, useRef } from 'react';
import {
  Star, Heart, MessageCircle, Send, BookOpen, Search, X,
  UserPlus, UserCheck, Users, Sparkles, MessageSquare
} from 'lucide-react';
import type {
  CurrentUser, Libro, Publicacion, Resena, RespuestaComunidad,
  SocialUser, FeedPublicacion
} from '../types';
import { api, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface CommunityViewProps {
  currentUser: CurrentUser | null;
  onOpenChat?: (user: SocialUser) => void;
  onOpenProfile?: (idUsuario: number) => void;
  onNavigate?: (view: string) => void;
}

type UnifiedFeedItem =
  | { kind: 'post'; id: number; fecha: string; data: Publicacion | FeedPublicacion }
  | { kind: 'review'; id: number; fecha: string; data: Resena };

function iniciales(nombre: string) {
  return (nombre || 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Avatar({
  foto,
  nombre,
  size = 40,
}: {
  foto?: string | null;
  nombre: string;
  size?: number;
}) {
  if (foto) {
    return (
      <img
        src={resolveImageUrl(foto)}
        alt={nombre}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--lime) 0%, var(--navy) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {iniciales(nombre)}
    </div>
  );
}

function timeAgo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  currentUser,
  onOpenChat,
  onOpenProfile,
}) => {
  const { showToast } = useToast();

  // Estados de datos
  const [publicaciones, setPublicaciones] = useState<FeedPublicacion[]>([]);
  const [feedSiguiendo, setFeedSiguiendo] = useState<FeedPublicacion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [respuestas, setRespuestas] = useState<RespuestaComunidad[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [sugerencias, setSugerencias] = useState<SocialUser[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtro de feed
  const [filtroFeed, setFiltroFeed] = useState<'todo' | 'siguiendo' | 'resenas'>('todo');

  // Modo de composición: 'publicar' o 'reseñar'
  const [modo, setModo] = useState<'publicar' | 'resenar'>('publicar');
  const [texto, setTexto] = useState('');
  const [calificacion, setCalificacion] = useState(0);
  const [estrellaHover, setEstrellaHover] = useState(0);
  const [libroSel, setLibroSel] = useState<Libro | null>(null);
  const [showLibros, setShowLibros] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Respuestas / comentarios expandidos
  const [comentariosAbiertos, setComentariosAbiertos] = useState<Record<string, boolean>>({});
  const [textoRespuesta, setTextoRespuesta] = useState<Record<string, string>>({});
  const [enviandoRespuesta, setEnviandoRespuesta] = useState<Record<string, boolean>>({});

  // Buscador de usuarios (columna lateral)
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<SocialUser[]>([]);
  const [buscando, setBuscando] = useState(false);
  const busquedaTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Carga inicial
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const idParam = currentUser?.id_usuario ? `?id_usuario=${currentUser.id_usuario}` : '';
      const [pubRes, resRes, respRes, libRes, segRes, feedSegRes] = await Promise.all([
        api(`/publicaciones${idParam}`),
        api('/resenas'),
        api('/respuestas'),
        api('/libros'),
        api('/social/buscar?q='),
        api('/social/feed'),
      ]);

      if (pubRes.ok) setPublicaciones(await pubRes.json());
      if (resRes.ok) setResenas(await resRes.json());
      if (respRes.ok) setRespuestas(await respRes.json());
      if (libRes.ok) setLibros(await libRes.json());
      if (segRes.ok) {
        const data: SocialUser[] = await segRes.json();
        setSugerencias(data.filter((u) => !u.yo_sigo && u.id_usuario !== currentUser?.id_usuario).slice(0, 5));
      }
      if (feedSegRes.ok) setFeedSiguiendo(await feedSegRes.json());
    } catch (err) {
      console.error('Error cargando comunidad:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [currentUser?.id_usuario]);

  // Búsqueda con debounce en la barra lateral
  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }
    clearTimeout(busquedaTimeout.current);
    busquedaTimeout.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await api(`/social/buscar?q=${encodeURIComponent(busqueda)}`);
        if (res.ok) setResultados(await res.json());
      } catch {
        /* ignore */
      }
      setBuscando(false);
    }, 400);
  }, [busqueda]);

  // Seguir / Dejar de seguir
  const toggleSeguir = async (idUsuario: number, yoSigo: boolean) => {
    try {
      const method = yoSigo ? 'DELETE' : 'POST';
      const res = await api(`/social/seguir/${idUsuario}`, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.mensaje || 'No se pudo procesar la acción');
      }

      showToast(yoSigo ? 'Dejaste de seguir a este usuario' : '¡Ahora sigues a este usuario!', 'success');

      setSugerencias((prev) =>
        prev.map((u) => (u.id_usuario === idUsuario ? { ...u, yo_sigo: !yoSigo } : u))
      );
      setResultados((prev) =>
        prev.map((u) => (u.id_usuario === idUsuario ? { ...u, yo_sigo: !yoSigo } : u))
      );

      // Recargar feed social de seguidos
      const feedRes = await api('/social/feed');
      if (feedRes.ok) setFeedSiguiendo(await feedRes.json());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo procesar la acción';
      showToast(msg, 'warning');
    }
  };

  // Like a publicación
  const toggleLike = async (idPublicacion: number) => {
    try {
      const res = await api(`/social/like/${idPublicacion}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const { liked } = await res.json();

      const updater = (prev: FeedPublicacion[]) =>
        prev.map((p) =>
          p.id_publicacion === idPublicacion
            ? {
                ...p,
                yo_di_like: liked ? 1 : 0,
                total_likes: (p.total_likes || 0) + (liked ? 1 : -1),
              }
            : p
        );

      setPublicaciones(updater);
      setFeedSiguiendo(updater);
    } catch {
      showToast('No se pudo dar me gusta', 'warning');
    }
  };

  // Crear publicación o reseña
  const handleSubmit = async () => {
    if (!currentUser?.id_usuario) {
      showToast('Inicia sesión como lector para participar en la comunidad.', 'warning');
      return;
    }

    if (modo === 'resenar') {
      if (!libroSel) {
        showToast('Selecciona un libro para reseñar.', 'warning');
        return;
      }
      if (calificacion === 0) {
        showToast('Selecciona una calificación en estrellas (1 a 5).', 'warning');
        return;
      }
      if (!texto.trim()) {
        showToast('Escribe tu opinión sobre el libro.', 'warning');
        return;
      }

      setEnviando(true);
      try {
        const res = await api('/nuevaResena', {
          method: 'POST',
          body: JSON.stringify({
            id_usuario: currentUser.id_usuario,
            id_libro: libroSel.id_libro,
            calificacion,
            comentario: texto.trim(),
          }),
        });
        if (!res.ok) throw new Error();
        showToast('¡Reseña publicada con éxito!', 'success');
        setTexto('');
        setCalificacion(0);
        setLibroSel(null);
        cargarDatos();
      } catch {
        showToast('No se pudo publicar la reseña.', 'warning');
      } finally {
        setEnviando(false);
      }
    } else {
      if (!texto.trim()) {
        showToast('Escribe un mensaje para compartir.', 'warning');
        return;
      }

      setEnviando(true);
      try {
        const res = await api('/nuevaPublicacion', {
          method: 'POST',
          body: JSON.stringify({
            id_usuario: currentUser.id_usuario,
            id_libro: libroSel?.id_libro ?? null,
            contenido: texto.trim(),
          }),
        });
        if (!res.ok) throw new Error();
        showToast('¡Publicación compartida!', 'success');
        setTexto('');
        setLibroSel(null);
        cargarDatos();
      } catch {
        showToast('No se pudo publicar.', 'warning');
      } finally {
        setEnviando(false);
      }
    }
  };

  // Responder a publicación o reseña
  const handleResponder = async (tipoOrigen: 'publicacion' | 'resena', idOrigen: number) => {
    const key = `${tipoOrigen}-${idOrigen}`;
    const comentario = textoRespuesta[key]?.trim();
    if (!comentario) return;

    if (!currentUser?.id_usuario) {
      showToast('Inicia sesión para responder.', 'warning');
      return;
    }

    setEnviandoRespuesta((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api('/nuevaRespuesta', {
        method: 'POST',
        body: JSON.stringify({
          id_usuario: currentUser.id_usuario,
          tipo_origen: tipoOrigen,
          id_origen: idOrigen,
          contenido: comentario,
        }),
      });
      if (!res.ok) throw new Error();

      setTextoRespuesta((prev) => ({ ...prev, [key]: '' }));
      showToast('Respuesta enviada', 'success');

      // Recargar respuestas
      const respRes = await api('/respuestas');
      if (respRes.ok) setRespuestas(await respRes.json());
    } catch {
      showToast('No se pudo enviar la respuesta', 'warning');
    } finally {
      setEnviandoRespuesta((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Lista de libros filtrados para el buscador de libro
  const librosOrdenados = libros
    .filter((l) => !libroSel || l.id_libro !== libroSel.id_libro)
    .slice(0, 30);

  // Armado del feed unificado según el filtro seleccionado
  const itemsFeed: UnifiedFeedItem[] = (() => {
    if (filtroFeed === 'siguiendo') {
      return feedSiguiendo.map((p) => ({
        kind: 'post' as const,
        id: p.id_publicacion,
        fecha: p.fecha,
        data: p,
      }));
    }
    if (filtroFeed === 'resenas') {
      return resenas.map((r) => ({
        kind: 'review' as const,
        id: r.id_resena,
        fecha: r.fecha,
        data: r,
      }));
    }
    // 'todo': une publicaciones y reseñas ordenadas por fecha descendente
    const posts: UnifiedFeedItem[] = publicaciones.map((p) => ({
      kind: 'post' as const,
      id: p.id_publicacion,
      fecha: p.fecha,
      data: p,
    }));
    const revs: UnifiedFeedItem[] = resenas.map((r) => ({
      kind: 'review' as const,
      id: r.id_resena,
      fecha: r.fecha,
      data: r,
    }));
    return [...posts, ...revs].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  })();

  return (
    <div className="social-layout">
      {/* ── Columna central (Feed y Creación) ── */}
      <div className="social-main">
        {/* Encabezado del Club de Lectura */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Comunidad Plopp</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Descubre lecturas, comparte reseñas con estrellas, interactúa y conecta con otros amantes de los libros.
          </p>
        </div>

        {/* Pestañas de filtro de actividad (Todo / Siguiendo / Reseñas) */}
        <div className="community-subnav" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`subnav-pill ${filtroFeed === 'todo' ? 'active' : ''}`}
            onClick={() => setFiltroFeed('todo')}
          >
            <Sparkles size={14} />
            <span>Todo el Club</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filtroFeed === 'siguiendo' ? 'active' : ''}`}
            onClick={() => setFiltroFeed('siguiendo')}
          >
            <Users size={14} />
            <span>Siguiendo</span>
          </button>
          <button
            type="button"
            className={`subnav-pill ${filtroFeed === 'resenas' ? 'active' : ''}`}
            onClick={() => setFiltroFeed('resenas')}
          >
            <Star size={14} />
            <span>Reseñas de Libros</span>
          </button>
        </div>

        {/* Caja de Publicación / Reseña unificada */}
        <div className="social-post-box">
          {/* Selector de modo: Publicar vs Reseñar */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <button
              type="button"
              className={modo === 'publicar' ? 'btn-primary' : 'social-btn-ghost'}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}
              onClick={() => setModo('publicar')}
            >
              <MessageCircle size={14} /> Publicación
            </button>
            <button
              type="button"
              className={modo === 'resenar' ? 'btn-primary' : 'social-btn-ghost'}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}
              onClick={() => setModo('resenar')}
            >
              <Star size={14} /> Reseñar con estrellas
            </button>
          </div>

          {/* Selector de estrellas interactivo si está en modo reseña */}
          {modo === 'resenar' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Tu calificación:</span>
              <div
                style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                onMouseLeave={() => setEstrellaHover(0)}
              >
                {[1, 2, 3, 4, 5].map((val) => {
                  const activa = val <= (estrellaHover || calificacion);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCalificacion(val)}
                      onMouseEnter={() => setEstrellaHover(val)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '3px 4px',
                        color: activa ? '#eab308' : 'var(--border-strong, #cbd5e1)',
                        transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.15s ease',
                        transform: activa ? 'scale(1.22)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={`Calificar con ${val} estrellas`}
                    >
                      <Star size={22} fill={activa ? '#eab308' : 'none'} />
                    </button>
                  );
                })}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: (estrellaHover || calificacion) ? '#eab308' : 'var(--text-muted)',
                  transition: 'color 0.2s ease',
                }}
              >
                {(() => {
                  const activeRating = estrellaHover || calificacion;
                  if (activeRating === 1) return '1 estrella · Malo';
                  if (activeRating === 2) return '2 estrellas · Regular';
                  if (activeRating === 3) return '3 estrellas · Bueno';
                  if (activeRating === 4) return '4 estrellas · Muy bueno';
                  if (activeRating === 5) return '5 estrellas · ¡Excelente!';
                  return 'Haz clic en las estrellas para calificar';
                })()}
              </span>
            </div>
          )}

          {/* Área de texto */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar foto={currentUser?.foto} nombre={currentUser?.nombre_usuario || 'Yo'} size={42} />
            <textarea
              className="social-post-input"
              placeholder={
                modo === 'resenar'
                  ? '¿Qué opinas de este libro? Comparte tu análisis, tus momentos favoritos o reflexiones...'
                  : '¿Qué estás leyendo? Comparte una recomendación, cita o pensamiento con la comunidad...'
              }
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Chip de libro seleccionado con miniatura */}
          {libroSel && (
            <div className="social-post-book-chip">
              {libroSel.portada ? (
                <img
                  src={resolveImageUrl(libroSel.portada)}
                  alt={libroSel.titulo}
                  style={{ width: 22, height: 30, objectFit: 'cover', borderRadius: 3 }}
                />
              ) : (
                <BookOpen size={14} />
              )}
              <span>{libroSel.titulo} — {libroSel.autor}</span>
              <button
                type="button"
                onClick={() => setLibroSel(null)}
                aria-label="Quitar libro seleccionado"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Acciones del composer */}
          <div className="social-post-actions">
            <button
              type="button"
              className="social-btn-ghost"
              onClick={() => setShowLibros((v) => !v)}
            >
              <BookOpen size={16} />
              {libroSel ? 'Cambiar libro' : modo === 'resenar' ? 'Seleccionar libro *' : 'Adjuntar libro'}
            </button>

            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>
              {texto.length}/500
            </span>

            <button
              type="button"
              className="btn-plopp-primary"
              style={{ padding: '8px 22px', fontSize: 14 }}
              onClick={handleSubmit}
              disabled={enviando || !texto.trim() || (modo === 'resenar' && (!libroSel || calificacion === 0))}
            >
              <Send size={14} /> {enviando ? 'Publicando...' : modo === 'resenar' ? 'Publicar Reseña' : 'Publicar'}
            </button>
          </div>

          {/* Desplegable para seleccionar libro */}
          {showLibros && (
            <div className="social-book-picker">
              {librosOrdenados.map((l) => (
                <button
                  key={l.id_libro}
                  type="button"
                  className="social-book-option"
                  onClick={() => {
                    setLibroSel(l);
                    setShowLibros(false);
                  }}
                >
                  {l.portada ? (
                    <img
                      src={resolveImageUrl(l.portada)}
                      alt={l.titulo}
                    />
                  ) : (
                    <div className="social-book-option-placeholder">
                      <BookOpen size={14} />
                    </div>
                  )}
                  <div>
                    <p>{l.titulo}</p>
                    <span>{l.autor}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Feed de Contenido ── */}
        {cargando ? (
          <div className="social-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="social-skeleton" />
            ))}
          </div>
        ) : itemsFeed.length === 0 ? (
          <div className="social-empty">
            <BookOpen size={44} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <h3>No hay publicaciones en esta sección</h3>
            <p>
              {filtroFeed === 'siguiendo'
                ? 'Sigue a otros lectores de la biblioteca para ver sus publicaciones aquí.'
                : '¡Sé la primera persona en compartir una reseña o pensamiento con la comunidad!'}
            </p>
          </div>
        ) : (
          <div className="social-feed">
            {itemsFeed.map((item) => {
              const isReview = item.kind === 'review';
              const reviewData = isReview ? (item.data as Resena) : null;
              const postData = !isReview ? (item.data as FeedPublicacion) : null;

              const idUsuario = item.data.id_usuario;
              const nombreUsuario = item.data.nombre_usuario || 'Lector';
              const fotoUrl = item.data.foto_url;
              const keyComentarios = `${item.kind}-${item.id}`;
              const respuestasItem = respuestas.filter(
                (r) =>
                  r.tipo_origen === (isReview ? 'resena' : 'publicacion') &&
                  Number(r.id_origen) === item.id
              );
              const totalRespuestas = respuestasItem.length;
              const abierto = !!comentariosAbiertos[keyComentarios];

              return (
                <div key={`${item.kind}-${item.id}`} className="social-card">
                  {/* Cabecera de la tarjeta */}
                  <div className="social-card-header">
                    <button
                      type="button"
                      className="social-user-btn"
                      onClick={() => onOpenProfile?.(idUsuario)}
                    >
                      <Avatar foto={fotoUrl} nombre={nombreUsuario} size={42} />
                      <div>
                        <strong>{nombreUsuario}</strong>
                        <span>
                          {isReview ? 'reseñó un libro · ' : ''}
                          {timeAgo(item.fecha)}
                        </span>
                      </div>
                    </button>

                    {/* Botón de mensaje directo si no es el usuario actual */}
                    {idUsuario !== currentUser?.id_usuario && (
                      <button
                        type="button"
                        className="social-btn-ghost"
                        onClick={() =>
                          onOpenChat?.({
                            id_usuario: idUsuario,
                            nombre: nombreUsuario,
                            foto_url: fotoUrl,
                          })
                        }
                      >
                        <MessageSquare size={14} /> Mensaje
                      </button>
                    )}
                  </div>

                  {/* Valoración en estrellas si es una reseña */}
                  {isReview && reviewData && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 3, color: '#eab308' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < Math.round(reviewData.calificacion) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {reviewData.calificacion} / 5
                      </span>
                    </div>
                  )}

                  {/* Libro adjunto (si tiene) */}
                  {item.data.titulo && (
                    <div className="social-card-book">
                      {item.data.portada ? (
                        <img
                          src={resolveImageUrl(item.data.portada)}
                          alt={item.data.titulo}
                        />
                      ) : (
                        <div className="social-card-book-placeholder">
                          <BookOpen size={20} />
                        </div>
                      )}
                      <div>
                        <strong>{item.data.titulo}</strong>
                        <span>{item.data.autor}</span>
                      </div>
                    </div>
                  )}

                  {/* Contenido / Comentario */}
                  <p className="social-card-content">
                    {isReview ? reviewData?.comentario : postData?.contenido}
                  </p>

                  {/* Pie de tarjeta: Me gusta y Comentarios */}
                  <div className="social-card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                    {!isReview && postData && (
                      <button
                        type="button"
                        className={`social-like-btn ${postData.yo_di_like ? 'liked' : ''}`}
                        onClick={() => toggleLike(postData.id_publicacion)}
                      >
                        <Heart size={16} fill={postData.yo_di_like ? 'currentColor' : 'none'} />
                        <span>{postData.total_likes ?? 0}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="social-btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 13 }}
                      onClick={() =>
                        setComentariosAbiertos((prev) => ({
                          ...prev,
                          [keyComentarios]: !prev[keyComentarios],
                        }))
                      }
                    >
                      <MessageCircle size={15} />
                      <span>{totalRespuestas > 0 ? `${totalRespuestas} respuestas` : 'Responder'}</span>
                    </button>
                  </div>

                  {/* Hilo de Respuestas / Comentarios */}
                  {abierto && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                      {respuestasItem.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                          {respuestasItem.map((resp) => (
                            <div
                              key={resp.id_respuesta}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                background: 'var(--sidebar-bg)',
                                padding: '8px 12px',
                                borderRadius: 10,
                                fontSize: 13,
                              }}
                            >
                              <Avatar foto={resp.foto_url} nombre={resp.nombre_usuario} size={26} />
                              <div style={{ flex: 1 }}>
                                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text)' }}>
                                  {resp.nombre_usuario}
                                </strong>
                                <span style={{ color: 'var(--text-secondary)' }}>{resp.contenido}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario para agregar respuesta */}
                      {currentUser?.id_usuario ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Escribe una respuesta a la comunidad..."
                            value={textoRespuesta[keyComentarios] || ''}
                            onChange={(e) =>
                              setTextoRespuesta((prev) => ({
                                ...prev,
                                [keyComentarios]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleResponder(isReview ? 'resena' : 'publicacion', item.id);
                              }
                            }}
                            maxLength={500}
                            style={{
                              flex: 1,
                              background: 'var(--input-bg, var(--sidebar-bg))',
                              border: '1px solid var(--border)',
                              borderRadius: 20,
                              padding: '8px 14px',
                              fontSize: 13,
                              color: 'var(--text)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ borderRadius: 20, padding: '8px 14px' }}
                            onClick={() => handleResponder(isReview ? 'resena' : 'publicacion', item.id)}
                            disabled={
                              enviandoRespuesta[keyComentarios] ||
                              !textoRespuesta[keyComentarios]?.trim()
                            }
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          Inicia sesión para responder a esta publicación.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Columna Lateral (Búsqueda + Lectores recomendados) ── */}
      <aside className="social-sidebar">
        {/* Buscador de Lectores */}
        <div className="social-search-box">
          <div className="social-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar lectores..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setResultados([]);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {resultados.length > 0 && (
            <div className="social-search-results">
              {resultados.map((u) => (
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
          {buscando && (
            <p style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Buscando lectores...
            </p>
          )}
        </div>

        {/* Sugerencias de Lectores */}
        {sugerencias.length > 0 && (
          <div className="social-suggestions">
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>
              Lectores que quizás conozcas
            </h3>
            {sugerencias.map((u) => (
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

        {/* Tarjeta Informativa del Club */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: 14, color: 'var(--text)' }}>Club de Lectura Plopp</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Conecta con otros apasionados de los libros, intercambia opiniones sinceras, califica tus títulos favoritos y encuentra nuevas lecturas sugeridas por la comunidad.
          </p>
        </div>
      </aside>
    </div>
  );
};

// ── Tarjeta de Usuario en la Barra Lateral ──────────────────────────────────
function UserCard({
  user,
  onSeguir,
  onChat,
  onProfile,
}: {
  user: SocialUser;
  onSeguir: () => void;
  onChat: () => void;
  onProfile: () => void;
}) {
  return (
    <div className="social-user-card">
      <button type="button" className="social-user-btn" onClick={onProfile}>
        <Avatar foto={user.foto_url} nombre={user.nombre} size={38} />
        <div>
          <strong>{user.nombre}</strong>
          {user.seguidores !== undefined && <span>{user.seguidores} seguidores</span>}
        </div>
      </button>
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
        <button
          type="button"
          className="social-btn-ghost"
          title="Mensaje directo"
          onClick={onChat}
          style={{ padding: '6px 8px' }}
        >
          <MessageSquare size={13} />
        </button>
        <button
          type="button"
          className={`social-follow-btn ${user.yo_sigo ? 'following' : ''}`}
          onClick={onSeguir}
          style={{ padding: '5px 12px', fontSize: 12 }}
        >
          {user.yo_sigo ? <UserCheck size={13} /> : <UserPlus size={13} />}
          {user.yo_sigo ? 'Siguiendo' : 'Seguir'}
        </button>
      </div>
    </div>
  );
}
