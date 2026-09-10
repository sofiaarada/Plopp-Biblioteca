export interface Usuario {
  id_usuario: number;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
}

export interface Libro {
  id_libro: number;
  titulo: string;
  autor: string;
  categoria: string;
  anio: number;
  estado: 'Disponible' | 'Prestado' | 'Mantenimiento';
  portada?: string | null;
  descripcion?: string | null;
}

export interface Prestamo {
  id_prestamo: number;
  id_usuario: number;
  id_libro?: number;
  fecha_prestamo: string;
  fecha_devolucion: string | null;
  estado: 'Activo' | 'Devuelto' | 'Vencido';
  nombreUsuario?: string;
  cedulaUsuario?: string;
  correoUsuario?: string;
  librosPrestados?: string;
  autor?: string;
  categoria?: string;
  anio?: number;
  portada?: string | null;
  descripcion?: string | null;
}

export interface DetallePrestamo {
  id_detalle: number;
  id_prestamo: number;
  id_libro: number;
}

export interface CuentaSistema {
  id_cuenta: number;
  nombre_usuario: string;
  correo: string;
  rol: 'admin' | 'bibliotecario' | 'usuario';
  fecha_creacion?: string;
}

export interface Perfil {
  id_usuario: number;
  nombre: string;
  correo: string;
  foto_url?: string | null;
  bio?: string | null;
}

export interface Resena {
  id_resena: number;
  calificacion: number;
  comentario?: string | null;
  fecha: string;
  id_usuario: number;
  nombre_usuario: string;
  foto_url?: string | null;
  id_libro: number;
  titulo?: string;
  autor?: string;
  portada?: string | null;
}

export interface RespuestaComunidad {
  id_respuesta: number;
  tipo_origen: 'publicacion' | 'resena';
  id_origen: number;
  contenido: string;
  fecha: string;
  id_usuario: number;
  nombre_usuario: string;
  foto_url?: string | null;
}

export interface Publicacion {
  id_publicacion: number;
  contenido: string;
  fecha: string;
  id_usuario: number;
  nombre_usuario: string;
  foto_url?: string | null;
  id_libro?: number | null;
  titulo?: string | null;
  autor?: string | null;
  portada?: string | null;
}

export interface CurrentUser {
  id_cuenta?: number | null;
  id_usuario?: number | null;
  nombre_usuario: string;
  nombre_completo?: string | null;
  correo: string;
  rol: 'admin' | 'bibliotecario' | 'usuario';
  token?: string;
  foto?: string | null;
}

// ── Tipos de la Red Social ──────────────────────────────────────────────────

export interface SocialUser {
  id_usuario: number;
  nombre: string;
  foto_url?: string | null;
  bio?: string | null;
  seguidores?: number;
  seguidos?: number;
  total_resenas?: number;
  libros_leidos?: number;
  yo_sigo?: number | boolean;
  no_leidos?: number;
  me_sigue?: number | boolean;
  total_seguidores?: number;
  total_seguidos?: number;
}

export interface FeedPublicacion {
  id_publicacion: number;
  contenido: string;
  fecha: string;
  id_usuario: number;
  nombre_usuario: string;
  foto_url?: string | null;
  id_libro?: number | null;
  titulo?: string | null;
  autor?: string | null;
  portada?: string | null;
  total_likes: number;
  yo_di_like: number | boolean;
}

export interface Mensaje {
  id_mensaje: number;
  id_emisor: number;
  id_receptor: number;
  contenido: string;
  fecha: string;
  leido: boolean;
  id_libro_recomendado?: number | null;
  libro_titulo?: string | null;
  libro_portada?: string | null;
  libro_autor?: string | null;
}

export interface Conversacion {
  id_usuario: number;
  nombre: string;
  foto_url?: string | null;
  ultimo_mensaje?: string;
  ultima_fecha?: string;
  no_leidos: number;
}

export interface Notificacion {
  id_notificacion?: number;
  id_notif?: number;
  id_usuario?: number;
  tipo: 'seguimiento' | 'mensaje' | 'like' | 'mencion' | 'recomendacion' | string;
  mensaje: string;
  id_origen?: number | null;
  id_referencia?: number | null;
  nombre_origen?: string | null;
  foto_url?: string | null;
  leida: boolean | number;
  fecha: string;
}

export interface ListaLectura {
  id: number;
  id_libro: number;
  titulo: string;
  autor: string;
  portada?: string | null;
  categoria?: string;
  anio?: number;
  estado: 'quiero_leer' | 'leyendo' | 'leido';
  fecha: string;
}

export interface StatsUsuario {
  seguidores: number;
  seguidos: number;
  resenas: number;
  leidos: number;
  leyendo: number;
  quiero_leer: number;
}

