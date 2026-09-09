import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, BookText, X, Edit, Trash2, Star, Send } from 'lucide-react';
import type { Libro, CurrentUser, Resena } from '../types';
import { api, resolveImageUrl } from '../api';
import { useToast } from './Toast';

interface BooksViewProps {
  userRole?: CurrentUser['rol'];
  currentUser?: CurrentUser | null;
}

export const BooksView: React.FC<BooksViewProps> = ({ userRole = 'usuario', currentUser = null }) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<Libro | null>(null);
  const [detailBook, setDetailBook] = useState<Libro | null>(null);
  const [bookReviews, setBookReviews] = useState<Resena[]>([]);
  const [bookRating, setBookRating] = useState(0);
  const [bookComment, setBookComment] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [bookAverage, setBookAverage] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [actionMode, setActionMode] = useState<'borrow' | 'return' | null>(null);
  const isReadOnly = userRole === 'usuario';

  // Estado para guardar los libros desde la BD
  const [libros, setLibros] = useState<Libro[]>([]);

  // Estados para el formulario
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [año, setAño] = useState('');
  const [portada, setPortada] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');

  // ==========================================
  // OBTENER LIBROS DEL BACKEND (GET)
  // ==========================================
  const fetchLibros = async () => {
    try {
      const response = await api('/libros');
      const data = await response.json();
      setLibros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener libros:", error);
    }
  };

  useEffect(() => {
    api('/libros')
      .then((response) => response.json())
      .then((data) => setLibros(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error al obtener libros:', error));
  }, []);

  useEffect(() => {
    if (!detailBook) return;
    api(`/resenas/libro/${detailBook.id_libro}`)
      .then((response) => response.json())
      .then((data) => {
        setBookReviews(Array.isArray(data?.resenas) ? data.resenas : []);
        setBookAverage(Number(data?.promedio) || 0);
        setReviewTotal(Number(data?.total) || 0);
      })
      .catch((error) => console.error('Error al obtener reseñas del libro:', error));
  }, [detailBook]);

  const openModalForCreate = () => {
    if (isReadOnly) return;
    setEditingId(null);
    setTitulo('');
    setAutor('');
    setCategoria('');
    setAño('');
    setPortada(null);
    setDescripcion('');
    setIsModalOpen(true);
  };

  const handleEdit = (libro: Libro) => {
    if (isReadOnly) return;
    setEditingId(libro.id_libro);
    setTitulo(libro.titulo);
    setAutor(libro.autor);
    setCategoria(libro.categoria);
    setAño(libro.año.toString());
    setPortada(libro.portada ?? null);
    setDescripcion(libro.descripcion ?? '');
    setIsModalOpen(true);
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La portada no puede superar los 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPortada(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este libro?')) return;
    try {
      const response = await api(`/eliminarLibro/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchLibros();
      } else {
        alert("Error al eliminar el libro");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const url = editingId
      ? `/actualizarLibro/${editingId}`
      : '/nuevoLibro';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await api(url, {
        method: method,
        body: JSON.stringify({
          titulo,
          autor,
          categoria,
          año: parseInt(año),
          estado: 'Disponible',
          portada,
          descripcion: descripcion.trim() || null,
        }),
      });

      if (response.ok) {
        fetchLibros();
        setIsModalOpen(false);
        showToast(
          editingId ? 'Descripción actualizada correctamente.' : 'Libro creado correctamente.',
          'success',
        );
        setTitulo('');
        setAutor('');
        setCategoria('');
        setAño('');
        setEditingId(null);
        setDescripcion('');
      } else {
        const errorData = await response.json().catch(() => null);
        showToast(errorData?.mensaje || 'No se pudo guardar el libro.', 'warning');
      }
    } catch (error) {
      console.error("Error al registrar libro:", error);
      showToast('No se pudo conectar con el servidor.', 'warning');
    }
  };

  const openQuickAction = (libro: Libro) => {
    setDetailBook(libro);
    setBookReviews([]);
    setBookAverage(0);
    setReviewTotal(0);
    setBookRating(0);
    setBookComment('');
  };

  const openLoanAction = () => {
    if (!detailBook) return;
    setSelectedBook(detailBook);
    setActionMode(detailBook.estado === 'Disponible' ? 'borrow' : 'return');
    setDetailBook(null);
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailBook || !currentUser?.id_usuario || bookRating === 0 || !bookComment.trim()) return;
    setIsSendingReview(true);
    try {
      const response = await api('/nuevaResena', {
        method: 'POST',
        body: JSON.stringify({
          id_usuario: currentUser.id_usuario,
          id_libro: detailBook.id_libro,
          calificacion: bookRating,
          comentario: bookComment.trim(),
        }),
      });
      if (!response.ok) throw new Error('No se pudo publicar la reseña');
      setBookRating(0);
      setBookComment('');
      const reviewsResponse = await api(`/resenas/libro/${detailBook.id_libro}`);
      const data = await reviewsResponse.json();
      setBookReviews(Array.isArray(data?.resenas) ? data.resenas : []);
      setBookAverage(Number(data?.promedio) || 0);
      setReviewTotal(Number(data?.total) || 0);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo publicar la reseña');
    } finally {
      setIsSendingReview(false);
    }
  };

  const handleBorrowOrReturn = async () => {
    if (!selectedBook) return;

    const borrowerId = currentUser?.id_usuario;

    if (!borrowerId) {
      alert('No se pudo identificar al lector. Inicia sesión o regístrate como lector para poder pedir libros.');
      setSelectedBook(null);
      setActionMode(null);
      return;
    }

    try {
      if (actionMode === 'borrow') {
        const fechaPrestamo = new Date().toISOString().split('T')[0];
        const fechaDevolucion = new Date();
        fechaDevolucion.setDate(fechaDevolucion.getDate() + 14);

        const loanResponse = await api('/nuevoPrestamo', {
          method: 'POST',
          body: JSON.stringify({
            id_usuario: borrowerId,
            id_libro: selectedBook.id_libro,
            fecha_prestamo: fechaPrestamo,
            fecha_devolucion: fechaDevolucion.toISOString().split('T')[0],
            estado: 'Activo'
          }),
        });

        if (!loanResponse.ok) {
          const errorData = await loanResponse.json().catch(() => ({}));
          throw new Error(errorData.mensaje || 'No se pudo registrar el préstamo');
        }

        const bookResponse = await api(`/actualizarLibro/${selectedBook.id_libro}`, {
          method: 'PUT',
          body: JSON.stringify({
            titulo: selectedBook.titulo,
            autor: selectedBook.autor,
            categoria: selectedBook.categoria,
            año: selectedBook.año,
            estado: 'Prestado',
            portada: selectedBook.portada,
            descripcion: selectedBook.descripcion
          })
        });

        if (!bookResponse.ok) {
          throw new Error('El préstamo se registró pero no se pudo actualizar el estado del libro');
        }
      }

      if (actionMode === 'return') {
        const prestamosResponse = await api('/prestamos');
        const prestamos = await prestamosResponse.json();
        const prestamoActivo = prestamos.find((prestamo: { id_prestamo: number; id_libro?: number; id_usuario?: number; fecha_prestamo?: string; fecha_devolucion?: string; estado?: string }) =>
          Number(prestamo.id_libro) === selectedBook.id_libro &&
          Number(prestamo.id_usuario) === borrowerId &&
          prestamo.estado !== 'Devuelto'
        );

        if (!prestamoActivo) {
          throw new Error('No hay un préstamo activo para este libro');
        }

        const prestamoResponse = await api(`/actualizarPrestamo/${prestamoActivo.id_prestamo}`, {
          method: 'PUT',
          body: JSON.stringify({
            id_usuario: prestamoActivo.id_usuario,
            id_libro: selectedBook.id_libro,
            fecha_prestamo: prestamoActivo.fecha_prestamo,
            fecha_devolucion: new Date().toISOString().split('T')[0],
            estado: 'Devuelto'
          })
        });

        if (!prestamoResponse.ok) {
          throw new Error('No se pudo actualizar el préstamo');
        }

        const bookResponse = await api(`/actualizarLibro/${selectedBook.id_libro}`, {
          method: 'PUT',
          body: JSON.stringify({
            titulo: selectedBook.titulo,
            autor: selectedBook.autor,
            categoria: selectedBook.categoria,
            año: selectedBook.año,
            estado: 'Disponible',
            portada: selectedBook.portada,
            descripcion: selectedBook.descripcion
          })
        });

        if (!bookResponse.ok) {
          throw new Error('La devolución se registró pero no se pudo actualizar el estado del libro');
        }
      }

      setSelectedBook(null);
      setActionMode(null);
      fetchLibros();
    } catch (error) {
      console.error('Error en la acción del libro:', error);
      alert(error instanceof Error ? error.message : 'No se pudo completar la acción');
    }
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <h2>Catálogo de Libros</h2>
        {!isReadOnly && (
          <button className="btn-primary" onClick={openModalForCreate}>
            <Plus size={20} />
            <span>Agregar Libro</span>
          </button>
        )}
      </div>

      <div className="books-grid">
        {libros.map((libro) => (
          <div
            key={libro.id_libro}
            className="book-card book-card-clickable"
            onClick={() => openQuickAction(libro)}
          >
            <div className="book-header">
              <div className="book-icon">
                <BookText size={22} />
              </div>
              <div className="book-header-actions">
                <span className={`badge ${
                  libro.estado === 'Disponible' ? 'success' : 
                  libro.estado === 'Prestado' ? 'warning' : 'danger'
                }`}>
                  {libro.estado}
                </span>
                {!isReadOnly && (
                  <>
                    <button className="btn-icon text-blue" onClick={(event) => { event.stopPropagation(); handleEdit(libro); }} title="Editar">
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon text-red" onClick={(event) => { event.stopPropagation(); handleDelete(libro.id_libro); }} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div>
              {libro.portada ? (
                <div className="book-cover-frame">
                  <img className="book-cover" src={resolveImageUrl(libro.portada)} alt={`Portada de ${libro.titulo}`} />
                </div>
              ) : (
                <div className="book-cover-frame book-cover-empty">
                  <BookText size={42} />
                  <span>Sin portada</span>
                </div>
              )}
              <h3 className="book-title">{libro.titulo}</h3>
              <p className="book-author">{libro.autor}</p>
              {libro.descripcion && <p className="book-description-preview">{libro.descripcion}</p>}
            </div>

            <div className="book-details">
              <div className="book-detail-item">
                <span>Categoría:</span>
                <span className="book-detail-value">{libro.categoria}</span>
              </div>
              <div className="book-detail-item">
                <span>Año:</span>
                <span className="book-detail-value">{libro.año}</span>
              </div>
              <div className="book-detail-item">
                <span>ID Libro:</span>
                <span className="book-detail-value">#{libro.id_libro}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailBook && createPortal(
        <div className="modal-overlay" onClick={() => setDetailBook(null)}>
          <div className="modal-content book-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="reader-eyebrow">Detalle del libro</span><h3>{detailBook.titulo}</h3></div>
              <button className="modal-close" onClick={() => setDetailBook(null)} aria-label="Cerrar detalle"><X size={24} /></button>
            </div>
            <div className="book-detail-hero">
              {detailBook.portada ? <img src={resolveImageUrl(detailBook.portada)} alt={`Portada de ${detailBook.titulo}`} /> : <div className="book-detail-cover-empty"><BookText size={48} /><span>Sin portada</span></div>}
              <div className="book-detail-summary">
                <span className="badge success">{detailBook.estado}</span>
                <p className="book-author">{detailBook.autor} · {detailBook.año}</p>
                <p className="book-detail-description">{detailBook.descripcion || 'Una historia para descubrir en Plopp Library. Explora las opiniones de otros lectores y encuentra tu próximo momento de lectura.'}</p>
                <div className="book-rating-summary"><strong>{bookAverage.toFixed(1)}</strong><span><Star size={20} fill="currentColor" /> {reviewTotal} reseñas</span></div>
                {userRole === 'usuario' && (
                  <button type="button" className="btn-primary book-loan-cta" onClick={openLoanAction}>
                    {detailBook.estado === 'Disponible' ? 'Solicitar préstamo' : 'Gestionar devolución'}
                  </button>
                )}
              </div>
            </div>

            <div className="book-reviews-section">
              <div className="book-reviews-heading"><h4>Reseñas de la comunidad</h4><span>{reviewTotal} opiniones</span></div>
              <div className="book-reviews-list">
                {bookReviews.length === 0 && <p className="reader-empty">Todavía no hay reseñas. Sé la primera persona en compartir su opinión.</p>}
                {bookReviews.map((review) => (
                  <article className="book-review" key={review.id_resena}>
                    <div className="book-review-meta"><strong>{review.nombre_usuario}</strong><span>{new Date(review.fecha).toLocaleDateString()}</span></div>
                    <div className="reader-stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill={index < review.calificacion ? 'currentColor' : 'none'} />)}</div>
                    {review.comentario && <p>{review.comentario}</p>}
                  </article>
                ))}
              </div>
              {currentUser?.id_usuario && (
                <form className="book-review-form" onSubmit={handleReviewSubmit}>
                  <h4>Deja tu reseña</h4>
                  <div className="star-picker" aria-label="Selecciona una calificación">
                    {Array.from({ length: 5 }).map((_, index) => <button key={index} type="button" className={index < bookRating ? 'active' : ''} onClick={() => setBookRating(index + 1)} aria-label={`${index + 1} estrellas`}><Star size={21} fill={index < bookRating ? 'currentColor' : 'none'} /></button>)}
                  </div>
                  <textarea value={bookComment} onChange={(event) => setBookComment(event.target.value)} placeholder="Comparte qué te pareció este libro..." required />
                  <button type="submit" className="btn-primary" disabled={isSendingReview || bookRating === 0}><Send size={15} /> {isSendingReview ? 'Publicando...' : 'Publicar reseña'}</button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedBook && actionMode && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{actionMode === 'borrow' ? 'Prestar libro' : 'Devolver libro'}</h3>
              <button className="modal-close" onClick={() => { setSelectedBook(null); setActionMode(null); }}>
                <X size={24} />
              </button>
            </div>

            <div className="form-group">
              <p><strong>Libro:</strong> {selectedBook.titulo}</p>
              <p><strong>Autor:</strong> {selectedBook.autor}</p>
              <p><strong>Estado actual:</strong> {selectedBook.estado}</p>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setSelectedBook(null); setActionMode(null); }}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleBorrowOrReturn}>
                {actionMode === 'borrow' ? 'Prestar libro' : 'Devolver libro'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Libro' : 'Registrar Nuevo Libro'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título del Libro</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. El Alquimista" 
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Autor</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Paulo Coelho" 
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  className="form-control" 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="Novela">Novela</option>
                  <option value="Ficción">Ficción</option>
                  <option value="Historia">Historia</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Tecnología">Tecnología</option>
                </select>
              </div>
              <div className="form-group">
                <label>Año de Publicación</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Ej. 1988" 
                  value={año}
                  onChange={(e) => setAño(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="descripcionLibro">Descripción</label>
                <textarea
                  id="descripcionLibro"
                  className="form-control"
                  placeholder="Escribe una breve descripción del libro"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="portada">Portada del libro</label>
                <input
                  id="portada"
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleCoverChange}
                />
                {portada && <img className="cover-preview" src={portada} alt="Vista previa de la portada" />}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Guardar'} Libro</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
