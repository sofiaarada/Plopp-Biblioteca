import db from '../config/db.js';

//Obtener conversaciones con el usuario 
export const getConversaciones = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [rows] = await db.query(
      `SELECT
         u.id_usuario, u.nombre, pf.foto_url,
         msg.contenido AS ultimo_mensaje,
         msg.fecha     AS ultima_fecha,
         (SELECT COUNT(*) FROM mensajes m2
          WHERE m2.id_emisor = u.id_usuario AND m2.id_receptor = ? AND m2.leido = 0) AS no_leidos
       FROM (
         SELECT CASE WHEN id_emisor = ? THEN id_receptor ELSE id_emisor END AS otro_id,
                MAX(fecha) AS ultima_fecha
         FROM mensajes
         WHERE id_emisor = ? OR id_receptor = ?
         GROUP BY otro_id
       ) conv
       JOIN usuarios u   ON u.id_usuario = conv.otro_id
       LEFT JOIN perfiles pf ON pf.id_usuario = u.id_usuario
       JOIN mensajes msg ON msg.fecha = conv.ultima_fecha
         AND (msg.id_emisor = conv.otro_id OR msg.id_receptor = conv.otro_id)
       ORDER BY conv.ultima_fecha DESC`,
      [idUsuario, idUsuario, idUsuario, idUsuario]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al cargar conversaciones' });
  }
};

// Obtener mensajes
export const getMensajes = async (req, res) => {
  const idUsuario  = req.usuario.id_usuario;
  const idReceptor = parseInt(req.params.id);
  try {
    const [rows] = await db.query(
      `SELECT m.*, l.titulo AS libro_titulo, l.portada AS libro_portada, l.autor AS libro_autor
       FROM mensajes m
       LEFT JOIN libros l ON l.id_libro = m.id_libro_recomendado
       WHERE (m.id_emisor = ? AND m.id_receptor = ?)
          OR (m.id_emisor = ? AND m.id_receptor = ?)
       ORDER BY m.fecha ASC`,
      [idUsuario, idReceptor, idReceptor, idUsuario]
    );
    // Marcar como leídos los recibidos
    await db.query(
      'UPDATE mensajes SET leido = 1 WHERE id_emisor = ? AND id_receptor = ? AND leido = 0',
      [idReceptor, idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al cargar mensajes' });
  }
};

// Enviar mensaje
export const enviarMensaje = async (req, res) => {
  const idEmisor   = req.usuario.id_usuario;
  const idReceptor = parseInt(req.params.id);
  const { contenido, id_libro_recomendado } = req.body;

  if (!contenido?.trim())
    return res.status(400).json({ mensaje: 'El mensaje no puede estar vacío' });

  try {
    const [result] = await db.query(
      'INSERT INTO mensajes (id_emisor, id_receptor, contenido, id_libro_recomendado) VALUES (?, ?, ?, ?)',
      [idEmisor, idReceptor, contenido.trim(), id_libro_recomendado || null]
    );

    // Notificación al receptor
    const [[emisor]] = await db.query('SELECT nombre FROM usuarios WHERE id_usuario=?',[idEmisor]);
    await db.query(
      'INSERT INTO notificaciones (id_usuario, tipo, mensaje, id_origen) VALUES (?,?,?,?)',
      [idReceptor, 'mensaje', `${emisor.nombre} te envió un mensaje`, idEmisor]
    );

    const [[nuevo]] = await db.query('SELECT * FROM mensajes WHERE id_mensaje = ?', [result.insertId]);
    res.status(201).json(nuevo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al enviar mensaje' });
  }
};

// Total de mensajes no leídos 
export const getNoLeidos = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM mensajes WHERE id_receptor = ? AND leido = 0',
      [idUsuario]
    );
    res.json({ total });
  } catch (e) {
    res.status(500).json({ total: 0 });
  }
};
