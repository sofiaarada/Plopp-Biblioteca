import db from '../config/db.js';

// Obtener mi lista de lectura
export const getMiLista = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [rows] = await db.query(
      `SELECT ll.id, ll.estado, ll.fecha, l.id_libro, l.titulo, l.autor, l.portada, l.categoria, l.anio
       FROM listas_lectura ll
       JOIN libros l ON l.id_libro = ll.id_libro
       WHERE ll.id_usuario = ?
       ORDER BY ll.fecha DESC`,
      [idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al cargar lista de lectura' });
  }
};

// Obtener lista de lectura de otro usuario
export const getListaDeUsuario = async (req, res) => {
  const idUsuario = parseInt(req.params.id);
  try {
    const [rows] = await db.query(
      `SELECT ll.id, ll.estado, ll.fecha, l.id_libro, l.titulo, l.autor, l.portada, l.categoria
       FROM listas_lectura ll
       JOIN libros l ON l.id_libro = ll.id_libro
       WHERE ll.id_usuario = ? AND ll.estado = 'leido'
       ORDER BY ll.fecha DESC LIMIT 20`,
      [idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al cargar lista' });
  }
};

// Agregar o actualizar un libro en la lista
export const upsertLista = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  const { id_libro, estado } = req.body;

  const estadosValidos = ['quiero_leer', 'leyendo', 'leido'];
  if (!id_libro || !estadosValidos.includes(estado))
    return res.status(400).json({ mensaje: 'Datos inválidos' });

  try {
    await db.query(
      `INSERT INTO listas_lectura (id_usuario, id_libro, estado)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE estado = VALUES(estado), fecha = NOW()`,
      [idUsuario, id_libro, estado]
    );
    res.json({ mensaje: 'Lista actualizada', estado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al actualizar lista de lectura' });
  }
};

// Quitar un libro de la lista
export const quitarDeLista = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  const id        = parseInt(req.params.id);
  try {
    await db.query('DELETE FROM listas_lectura WHERE id = ? AND id_usuario = ?', [id, idUsuario]);
    res.json({ mensaje: 'Libro quitado de la lista' });
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al quitar libro' });
  }
};
