import type { Usuario, Libro, Prestamo, DetallePrestamo } from './types';

export const mockUsuarios: Usuario[] = [
  { id_usuario: 1, nombre: 'Ana García', cedula: '1001234567', correo: 'ana.garcia@email.com', telefono: '300-123-4567' },
  { id_usuario: 2, nombre: 'Carlos Ruiz', cedula: '1002345678', correo: 'carlos.ruiz@email.com', telefono: '310-987-6543' },
  { id_usuario: 3, nombre: 'María López', cedula: '1003456789', correo: 'maria.lopez@email.com', telefono: '320-555-0192' },
];

export const mockLibros: Libro[] = [
  { id_libro: 101, titulo: 'Cien Años de Soledad', autor: 'Gabriel García Márquez', categoria: 'Novela', año: 1967, estado: 'Prestado' },
  { id_libro: 102, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', categoria: 'Clásico', año: 1605, estado: 'Disponible' },
  { id_libro: 103, titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', categoria: 'Infantil', año: 1943, estado: 'Disponible' },
  { id_libro: 104, titulo: 'Ficciones', autor: 'Jorge Luis Borges', categoria: 'Cuentos', año: 1944, estado: 'Mantenimiento' },
  { id_libro: 105, titulo: 'La Sombra del Viento', autor: 'Carlos Ruiz Zafón', categoria: 'Misterio', año: 2001, estado: 'Prestado' },
];

export const mockPrestamos: Prestamo[] = [
  { id_prestamo: 1001, id_usuario: 1, fecha_prestamo: '2023-10-15', fecha_devolucion: null, estado: 'Activo' },
  { id_prestamo: 1002, id_usuario: 2, fecha_prestamo: '2023-09-01', fecha_devolucion: '2023-09-15', estado: 'Devuelto' },
  { id_prestamo: 1003, id_usuario: 3, fecha_prestamo: '2023-10-01', fecha_devolucion: null, estado: 'Vencido' },
];

export const mockDetalles: DetallePrestamo[] = [
  { id_detalle: 1, id_prestamo: 1001, id_libro: 101 },
  { id_detalle: 2, id_prestamo: 1002, id_libro: 102 },
  { id_detalle: 3, id_prestamo: 1003, id_libro: 105 },
];
