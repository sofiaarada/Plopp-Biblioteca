import { useEffect, useState } from 'react';
import { Star, Send, BookOpen, MessageCircle, Reply, Search, X } from 'lucide-react';
import type { CurrentUser, Libro, Publicacion, Resena, RespuestaComunidad } from '../types';
import { api } from '../api';
import { useToast } from './Toast';

interface CommunityViewProps {
  currentUser: CurrentUser | null;
}

type FeedItem =
  | { kind: 'post'; fecha: string; data: Publicacion }
  | { kind: 'review'; fecha: string; data: Resena };

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Avatar({ foto, nombre }: { foto?: string | null; nombre: string }) {
  if (foto) return <img src={foto} alt={nombre} className="community-avatar" />;
  return <div className="community-avatar">{iniciales(nombre)}</div>;
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <div className="community-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < Math.round(valor) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

export const CommunityView: React.FC<CommunityViewProps> = ({ currentUser }) => {
  const { showToast } = useToast();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [texto, setTexto] = useState('');
  const [libroSeleccionado, setLibroSeleccionado] = useState('');
  const [busquedaLibro, setBusquedaLibro] = useState('');
  const [modo, setModo] = useState<'publicar' | 'reseñar'>('publicar');
  const [calificacion, setCalificacion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [respuestas, setRespuestas] = useState<RespuestaComunidad[]>([]);
  const [respuestaActiva, setRespuestaActiva] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const cargarFeed = () => {
    Promise.all([api('/publicaciones'), api('/resenas'), api('/libros'), api('/respuestas')])
      .then(async ([publicacionesResponse, resenasResponse, librosResponse, respuestasResponse]) => {
        if (!publicacionesResponse.ok || !resenasResponse.ok || !librosResponse.ok || !respuestasResponse.ok) {
          throw new Error('No se pudo cargar la comunidad');
        }
        const [publicacionesData, resenasData, librosData, respuestasData] = await Promise.all([
          publicacionesResponse.json(),
          resenasResponse.json(),
          librosResponse.json(), respuestasResponse.json(),
        ]);
        setPublicaciones(Array.isArray(publicacionesData) ? publicacionesData : []);
        setResenas(Array.isArray(resenasData) ? resenasData : []);
        setLibros(Array.isArray(librosData) ? librosData : []);
        setRespuestas(Array.isArray(respuestasData) ? respuestasData : []);
      })
      .catch(() => showToast('No se pudo cargar la comunidad. Verifica que el servidor esté activo.', 'warning'));
  };

  const handleResponder = async (tipoOrigen: 'publicacion' | 'resena', idOrigen: number) => {
    if (!currentUser?.id_usuario) {
      showToast('Inicia sesión como lector para responder.', 'warning');
      return;
    }
    if (!textoRespuesta.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const response = await api('/nuevaRespuesta', {
        method: 'POST',
        body: JSON.stringify({
          id_usuario: currentUser.id_usuario,
          tipo_origen: tipoOrigen,
          id_origen: idOrigen,
          contenido: textoRespuesta,
        }),
      });
      if (!response.ok) throw new Error('No se pudo publicar la respuesta');
      setTextoRespuesta('');
      setRespuestaActiva(null);
      cargarFeed();
      showToast('Respuesta publicada.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo publicar la respuesta.', 'warning');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const respuestasDe = (tipoOrigen: 'publicacion' | 'resena', idOrigen: number) =>
    respuestas.filter((respuesta) => respuesta.tipo_origen === tipoOrigen && respuesta.id_origen === idOrigen);

  const renderRespuestas = (tipoOrigen: 'publicacion' | 'resena', idOrigen: number) => {
    const key = `${tipoOrigen}-${idOrigen}`;
    const respuestasItem = respuestasDe(tipoOrigen, idOrigen);
    return (
      <div className="community-replies">
        {respuestasItem.map((respuesta) => (
          <div className="community-reply" key={respuesta.id_respuesta}>
            <strong>{respuesta.nombre_usuario}</strong>
            <span>{respuesta.contenido}</span>
          </div>
        ))}
        {currentUser?.id_usuario && (respuestaActiva === key ? (
          <div className="community-reply-form">
            <input value={textoRespuesta} onChange={(event) => setTextoRespuesta(event.target.value)} placeholder="Escribe una respuesta..." maxLength={500} />
            <button type="button" className="btn-primary" onClick={() => handleResponder(tipoOrigen, idOrigen)} disabled={enviandoRespuesta || !textoRespuesta.trim()}>
              <Send size={14} />
            </button>
          </div>
        ) : (
          <button type="button" className="community-reply-button" onClick={() => setRespuestaActiva(key)}><Reply size={14} /> Responder</button>
        ))}
      </div>
    );
  };

  useEffect(() => { cargarFeed(); }, []);

  const feed: FeedItem[] = [
    ...publicaciones.map((p) => ({ kind: 'post' as const, fecha: p.fecha, data: p })),
    ...resenas.map((r) => ({ kind: 'review' as const, fecha: r.fecha, data: r })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const librosFiltrados = libros.filter((libro) => {
    const termino = busquedaLibro.trim().toLowerCase();
    return !termino || `${libro.titulo} ${libro.autor}`.toLowerCase().includes(termino);
  }).slice(0, 6);

  const libroElegido = libros.find((libro) => String(libro.id_libro) === libroSeleccionado);

  const handleEnviar = async () => {
    if (!currentUser?.id_usuario) {
      showToast('Necesitas iniciar sesión como lector para participar en la comunidad.', 'warning');
      return;
    }
    if (modo === 'reseñar' && (!libroSeleccionado || calificacion === 0)) {
      showToast('Elige un libro y una calificación en estrellas.', 'warning');
      return;
    }
    if (!texto.trim()) {
      showToast('Escribe algo antes de publicar.', 'warning');
      return;
    }

    setEnviando(true);
    try {
      if (modo === 'reseñar') {
        const res = await api('/nuevaResena', {
          method: 'POST',
          body: JSON.stringify({
            id_usuario: currentUser.id_usuario,
            id_libro: Number(libroSeleccionado),
            calificacion,
            comentario: texto,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.mensaje || 'No se pudo publicar la reseña');
        }
        showToast('¡Reseña publicada!', 'success');
      } else {
        const res = await api('/nuevaPublicacion', {
          method: 'POST',
          body: JSON.stringify({
            id_usuario: currentUser.id_usuario,
            id_libro: libroSeleccionado ? Number(libroSeleccionado) : null,
            contenido: texto,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.mensaje || 'No se pudo publicar');
        }
        showToast('¡Publicado en la comunidad!', 'success');
      }
      setTexto('');
      setCalificacion(0);
      setLibroSeleccionado('');
      setBusquedaLibro('');
      cargarFeed();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo publicar. Intenta de nuevo.', 'warning');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="community-layout">
      <div>
        <div className="community-composer">
          <div className="community-composer-actions" style={{ marginTop: 0, marginBottom: 10 }}>
            <button
              type="button"
              className={modo === 'publicar' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setModo('publicar')}
            >
              <MessageCircle size={14} /> Publicar
            </button>
            <button
              type="button"
              className={modo === 'reseñar' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setModo('reseñar')}
            >
              <Star size={14} /> Reseñar un libro
            </button>
          </div>

          {modo === 'reseñar' || modo === 'publicar' ? (
            <div className="book-search-picker">
              <div className="book-search-input-wrap">
                <Search size={17} />
                <input
                  type="search"
                  value={libroElegido ? libroElegido.titulo : busquedaLibro}
                  onChange={(event) => {
                    setBusquedaLibro(event.target.value);
                    setLibroSeleccionado('');
                  }}
                  placeholder={modo === 'reseñar' ? 'Buscar libro por título o autor...' : 'Vincular libro opcionalmente...'}
                  aria-label="Buscar libro por título o autor"
                />
                {libroElegido && (
                  <button type="button" onClick={() => { setLibroSeleccionado(''); setBusquedaLibro(''); }} aria-label="Cambiar libro">
                    <X size={16} />
                  </button>
                )}
              </div>
              {!libroElegido && (
                <div className="book-search-results">
                  {librosFiltrados.length > 0 ? librosFiltrados.map((libro) => (
                    <button
                      type="button"
                      key={libro.id_libro}
                      onClick={() => { setLibroSeleccionado(String(libro.id_libro)); setBusquedaLibro(''); }}
                    >
                      <strong>{libro.titulo}</strong>
                      <span>{libro.autor}</span>
                    </button>
                  )) : <span className="book-search-empty">No encontramos libros con esa búsqueda.</span>}
                </div>
              )}
            </div>
          ) : null}

          {modo === 'reseñar' && (
            <div className="star-picker" style={{ marginBottom: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i < calificacion ? 'active' : ''}
                  onClick={() => setCalificacion(i + 1)}
                >
                  <Star size={20} fill={i < calificacion ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          )}

          <textarea
            placeholder={modo === 'reseñar' ? '¿Qué te pareció el libro?' : '¿Qué estás leyendo? Comparte con la comunidad...'}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          <div className="community-composer-actions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Publicando como {currentUser?.nombre_usuario ?? 'invitado'}
            </span>
            <button type="button" className="btn-primary" onClick={handleEnviar} disabled={enviando}>
              <Send size={14} /> {enviando ? 'Enviando...' : 'Compartir'}
            </button>
          </div>
        </div>

        <div className="community-feed">
          {feed.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Todavía no hay nada en la comunidad. ¡Sé la primera persona en compartir algo!
            </p>
          )}

          {feed.map((item) =>
            item.kind === 'review' ? (
              <div key={`r-${item.data.id_resena}`} className="community-card">
                <div className="community-card-header">
                  <Avatar foto={item.data.foto_url} nombre={item.data.nombre_usuario} />
                  <div className="community-card-meta">
                    <strong>{item.data.nombre_usuario}</strong>
                    <span>reseñó un libro · {new Date(item.data.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
                <Estrellas valor={item.data.calificacion} />
                {item.data.comentario && <p>{item.data.comentario}</p>}
                <div className="community-card-book">
                  <BookOpen size={18} />
                  <div>
                    <strong style={{ fontSize: 13 }}>{item.data.titulo}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.data.autor}</div>
                  </div>
                </div>
                {renderRespuestas('resena', item.data.id_resena)}
              </div>
            ) : (
              <div key={`p-${item.data.id_publicacion}`} className="community-card">
                <div className="community-card-header">
                  <Avatar foto={item.data.foto_url} nombre={item.data.nombre_usuario} />
                  <div className="community-card-meta">
                    <strong>{item.data.nombre_usuario}</strong>
                    <span>{new Date(item.data.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
                <p>{item.data.contenido}</p>
                {item.data.titulo && (
                  <div className="community-card-book">
                    <BookOpen size={18} />
                    <div>
                      <strong style={{ fontSize: 13 }}>{item.data.titulo}</strong>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.data.autor}</div>
                    </div>
                  </div>
                )}
                {renderRespuestas('publicacion', item.data.id_publicacion)}
              </div>
            )
          )}
        </div>
      </div>

      <div className="community-sidebar-card">
        <h3 style={{ marginBottom: 10, fontSize: 14 }}>Sobre la Comunidad</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Comparte lo que estás leyendo, reseña libros con estrellas y descubre qué recomiendan
          otros lectores de Plopp Library.
        </p>
      </div>
    </div>
  );
};
