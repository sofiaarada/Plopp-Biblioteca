import db from '../config/db.js';

// Obtener notificaciones
export const getNotificaciones = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [rows] = await db.query(
      `SELECT n.*, u.nombre AS nombre_origen, pf.foto_url
       FROM notificaciones n
       LEFT JOIN usuarios u  ON u.id_usuario = n.id_origen
       LEFT JOIN perfiles pf ON pf.id_usuario = n.id_origen
       WHERE n.id_usuario = ?
       ORDER BY n.fecha DESC
       LIMIT 30`,
      [idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al cargar notificaciones' });
  }
};

// Marcar todas como leídas
export const marcarLeidas = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    await db.query('UPDATE notificaciones SET leida = 1 WHERE id_usuario = ?', [idUsuario]);
    res.json({ mensaje: 'Notificaciones marcadas como leídas' });
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al marcar notificaciones' });
  }
};

// Conteo de notificaciones no leídas
export const getNoLeidas = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario = ? AND leida = 0',
      [idUsuario]
    );
    res.json({ total });
  } catch (e) {
    res.status(500).json({ total: 0 });
  }
};
