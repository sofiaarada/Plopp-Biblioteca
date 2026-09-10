import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Star } from 'lucide-react';
import type { CurrentUser, Libro, Prestamo, Resena } from '../types';
import { api, resolveImageUrl } from '../api';

interface ReaderHomeViewProps {
  currentUser: CurrentUser | null;
  onNavigate: (view: string) => void;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="reader-stars" aria-label={`${value} estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={14} fill={index < Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export const ReaderHomeView: React.FC<ReaderHomeViewProps> = ({ currentUser, onNavigate }) => {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

  useEffect(() => {
    Promise.all([api('/libros'), api('/resenas'), api('/prestamos')])
      .then(async ([librosResponse, resenasResponse, prestamosResponse]) => {
        const [librosData, resenasData, prestamosData] = await Promise.all([
          librosResponse.json(), resenasResponse.json(), prestamosResponse.json(),
        ]);
        setLibros(Array.isArray(librosData) ? librosData : []);
        setResenas(Array.isArray(resenasData) ? resenasData : []);
        setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
      })
      .catch((error) => console.error('Error al cargar el inicio del lector:', error));
  }, []);

  const activeLoan = prestamos.find(
    (prestamo) => prestamo.id_usuario === currentUser?.id_usuario && prestamo.estado === 'Activo',
  );
  const currentBook = libros.find((libro) => libro.id_libro === activeLoan?.id_libro);
  const progress = currentBook ? 42 : 0;
  const latestBooks = [...libros].sort((a, b) => b.anio - a.anio).slice(0, 4);
  const recommendations = resenas
    .filter((resena, index, all) => all.findIndex((item) => item.id_libro === resena.id_libro) === index)
    .slice(0, 4);

  return (
    <div className="reader-home">
      <span className="plopp-blob blob-lime blob-1" />
      <span className="plopp-blob blob-lavender blob-2" />
      <span className="plopp-blob blob-navy blob-3" />

      <header className="reader-home-heading">
        <div>
          <span className="reader-eyebrow">Tu rincón de lectura</span>
          <h2>Hola, {currentUser?.nombre_usuario?.split(' ')[0] || 'lector'}</h2>
          <p>Continúa tu historia y descubre tu próxima lectura.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => onNavigate('books')}>
          Explorar catálogo <ArrowRight size={17} />
        </button>
      </header>

      <section className="reader-progress-card">
        <div className="reader-progress-copy">
          <span className="reader-eyebrow">Ahora leyendo</span>
          {currentBook ? (
            <>
              <h3>{currentBook.titulo}</h3>
              <p>{currentBook.autor}</p>
              <div className="reader-progress-track" aria-label={`${progress}% leído`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="reader-progress-meta"><strong>{progress}%</strong><span>de tu lectura completada</span></div>
            </>
          ) : (
            <>
              <h3>Tu próxima historia te espera</h3>
              <p>Solicita un libro del catálogo para comenzar a registrar tu progreso.</p>
              <button type="button" className="btn-primary" onClick={() => onNavigate('books')}>Buscar un libro</button>
            </>
          )}
        </div>
        <img src="/mascots/welcomeplopp.png" alt="Personaje leyendo un libro" className="reader-progress-mascot" />
      </section>

      <section className="reader-section">
        <div className="reader-section-heading"><div><span className="reader-eyebrow">Lo que leen otros</span><h3>Recomendaciones de la comunidad</h3></div><button type="button" className="reader-text-button" onClick={() => onNavigate('community')}>Ver comunidad <ArrowRight size={15} /></button></div>
        <div className="reader-book-grid">
          {recommendations.map((review) => (
            <article className="reader-mini-book" key={review.id_libro}>
              {review.portada ? <img src={resolveImageUrl(review.portada)} alt={`Portada de ${review.titulo}`} /> : <div className="reader-mini-cover"><BookOpen size={26} /></div>}
              <div><strong>{review.titulo || 'Libro recomendado'}</strong><span>{review.autor || 'Plopp Library'}</span><Stars value={review.calificacion} /></div>
            </article>
          ))}
          {recommendations.length === 0 && <p className="reader-empty">Las recomendaciones aparecerán cuando la comunidad publique reseñas.</p>}
        </div>
      </section>

      <section className="reader-section">
        <div className="reader-section-heading"><div><span className="reader-eyebrow">Recién llegados</span><h3>Novedades</h3></div><CalendarDays size={20} /></div>
        <div className="reader-new-grid">
          {latestBooks.map((book) => (
            <button type="button" className="reader-new-book" key={book.id_libro} onClick={() => onNavigate('books')}>
              {book.portada ? <img src={resolveImageUrl(book.portada)} alt={`Portada de ${book.titulo}`} /> : <span className="reader-new-cover"><BookOpen size={24} /></span>}
              <span><strong>{book.titulo}</strong><small>{book.autor} · {book.anio}</small></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
