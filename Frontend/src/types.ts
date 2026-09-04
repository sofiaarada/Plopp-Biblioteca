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
  año: number;
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
  año?: number;
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
  correo: string;
  rol: 'admin' | 'bibliotecario' | 'usuario';
  token?: string;
}
