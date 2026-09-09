import db from '../config/db.js';

// Seguir a un usuario
export const seguirUsuario = async (req, res) => {
  const idSeguidor = req.usuario?.id_usuario;
  const idSeguido  = parseInt(req.params.id);

  if (!idSeguidor) {
    return res.status(400).json({ mensaje: 'No se pudo identificar tu perfil de lector. Vuelve a iniciar sesión.' });
  }

  if (idSeguidor === idSeguido) {
    return res.status(400).json({ mensaje: 'No puedes seguirte a ti mismo' });
  }

  try {
    await db.query(
      'INSERT IGNORE INTO seguimientos (id_seguidor, id_seguido) VALUES (?, ?)',
      [idSeguidor, idSeguido]
    );

    // Notificar al seguido
    try {
      const [rows] = await db.query(
        'SELECT nombre FROM usuarios WHERE id_usuario = ?', [idSeguidor]
      );
      const nombreSeguidor = rows[0]?.nombre || 'Un lector';
      await db.query(
        'INSERT INTO notificaciones (id_usuario, tipo, mensaje, id_origen) VALUES (?, ?, ?, ?)',
        [idSeguido, 'seguimiento', `${nombreSeguidor} comenzó a seguirte`, idSeguidor]
      );
    } catch (notifErr) {
      console.error('Error enviando notificación de seguimiento:', notifErr);
    }

    res.json({ mensaje: 'Ahora sigues a este usuario' });
  } catch (e) {
    console.error('Error en seguirUsuario:', e);
    res.status(500).json({ mensaje: 'Error al seguir a este usuario' });
  }
};

// Dejar de seguir
export const dejarDeSeguir = async (req, res) => {
  const idSeguidor = req.usuario?.id_usuario;
  const idSeguido  = parseInt(req.params.id);

  if (!idSeguidor) {
    return res.status(400).json({ mensaje: 'No se pudo identificar tu perfil de lector' });
  }

  try {
    await db.query(
      'DELETE FROM seguimientos WHERE id_seguidor = ? AND id_seguido = ?',
      [idSeguidor, idSeguido]
    );
    res.json({ mensaje: 'Dejaste de seguir a este usuario' });
  } catch (e) {
    console.error('Error en dejarDeSeguir:', e);
    res.status(500).json({ mensaje: 'Error al dejar de seguir' });
  }
};

// Seguidores de un usuario
export const getSeguidores = async (req, res) => {
  const idUsuario = parseInt(req.params.id);
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, p.foto_url
       FROM seguimientos s
       JOIN usuarios u ON u.id_usuario = s.id_seguidor
       LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
       WHERE s.id_seguido = ?`,
      [idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al obtener seguidores' });
  }
};

// Seguidos de un usuario
export const getSeguidos = async (req, res) => {
  const idUsuario = parseInt(req.params.id);
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, p.foto_url
       FROM seguimientos s
       JOIN usuarios u ON u.id_usuario = s.id_seguido
       LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
       WHERE s.id_seguidor = ?`,
      [idUsuario]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al obtener seguidos' });
  }
};

// Feed social de usuarios seguidos
export const getFeedSocial = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  try {
    const [rows] = await db.query(
      `SELECT pub.id_publicacion, pub.contenido, pub.fecha,
              u.id_usuario, u.nombre AS nombre_usuario, pf.foto_url,
              l.titulo, l.autor, l.portada, l.id_libro,
              (SELECT COUNT(*) FROM likes_publicaciones lk WHERE lk.id_publicacion = pub.id_publicacion) AS total_likes,
              (SELECT COUNT(*) FROM likes_publicaciones lk WHERE lk.id_publicacion = pub.id_publicacion AND lk.id_usuario = ?) AS yo_di_like
       FROM publicaciones pub
       JOIN usuarios u ON u.id_usuario = pub.id_usuario
       LEFT JOIN perfiles pf ON pf.id_usuario = pub.id_usuario
       LEFT JOIN libros l ON l.id_libro = pub.id_libro
       WHERE pub.id_usuario IN (
         SELECT id_seguido FROM seguimientos WHERE id_seguidor = ?
       ) OR pub.id_usuario = ?
       ORDER BY pub.fecha DESC
       LIMIT 50`,
      [idUsuario, idUsuario, idUsuario]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al cargar el feed' });
  }
};

// Buscar usuarios
export const buscarUsuarios = async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const idActual = req.usuario.id_usuario;
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, pf.foto_url, pf.bio,
              (SELECT COUNT(*) FROM seguimientos WHERE id_seguido = u.id_usuario) AS seguidores,
              (SELECT 1 FROM seguimientos WHERE id_seguidor = ? AND id_seguido = u.id_usuario LIMIT 1) AS yo_sigo
       FROM usuarios u
       LEFT JOIN perfiles pf ON pf.id_usuario = u.id_usuario
       WHERE u.nombre LIKE ? AND u.id_usuario != ?
       LIMIT 20`,
      [idActual, q, idActual]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error en la búsqueda' });
  }
};

// Perfil público de un usuario
export const getPerfilPublico = async (req, res) => {
  const idObjetivo = parseInt(req.params.id);
  const idActual   = req.usuario?.id_usuario || 0;
  try {
    const [[usuario]] = await db.query(
      `SELECT u.id_usuario, u.nombre, pf.foto_url, pf.bio,
              (SELECT COUNT(*) FROM seguimientos WHERE id_seguido = u.id_usuario)  AS seguidores,
              (SELECT COUNT(*) FROM seguimientos WHERE id_seguidor = u.id_usuario) AS seguidos,
              (SELECT COUNT(*) FROM resenas WHERE id_usuario = u.id_usuario)       AS total_resenas,
              (SELECT COUNT(*) FROM listas_lectura WHERE id_usuario = u.id_usuario AND estado = 'leido') AS libros_leidos,
              (SELECT 1 FROM seguimientos WHERE id_seguidor = ? AND id_seguido = u.id_usuario LIMIT 1) AS yo_sigo
       FROM usuarios u
       LEFT JOIN perfiles pf ON pf.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [idActual, idObjetivo]
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // Publicaciones recientes
    const [publicaciones] = await db.query(
      `SELECT pub.*, l.titulo, l.autor, l.portada,
              (SELECT COUNT(*) FROM likes_publicaciones lk WHERE lk.id_publicacion = pub.id_publicacion) AS total_likes
       FROM publicaciones pub
       LEFT JOIN libros l ON l.id_libro = pub.id_libro
       WHERE pub.id_usuario = ?
       ORDER BY pub.fecha DESC LIMIT 10`,
      [idObjetivo]
    );

    // Reseñas recientes
    const [resenas] = await db.query(
      `SELECT r.*, l.titulo, l.autor, l.portada
       FROM resenas r
       JOIN libros l ON l.id_libro = r.id_libro
       WHERE r.id_usuario = ?
       ORDER BY r.fecha DESC LIMIT 10`,
      [idObjetivo]
    );

    res.json({ ...usuario, publicaciones, resenas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al cargar perfil' });
  }
};

// Like / Unlike en publicación
export const toggleLike = async (req, res) => {
  const idUsuario     = req.usuario.id_usuario;
  const idPublicacion = parseInt(req.params.id);
  try {
    const [[existe]] = await db.query(
      'SELECT id FROM likes_publicaciones WHERE id_usuario = ? AND id_publicacion = ?',
      [idUsuario, idPublicacion]
    );
    if (existe) {
      await db.query(
        'DELETE FROM likes_publicaciones WHERE id_usuario = ? AND id_publicacion = ?',
        [idUsuario, idPublicacion]
      );
      res.json({ liked: false });
    } else {
      await db.query(
        'INSERT INTO likes_publicaciones (id_usuario, id_publicacion) VALUES (?, ?)',
        [idUsuario, idPublicacion]
      );
      // Notificar al autor
      const [[pub]] = await db.query(
        'SELECT id_usuario FROM publicaciones WHERE id_publicacion = ?', [idPublicacion]
      );
      if (pub && pub.id_usuario !== idUsuario) {
        const [[autor]] = await db.query('SELECT nombre FROM usuarios WHERE id_usuario=?',[idUsuario]);
        await db.query(
          'INSERT INTO notificaciones (id_usuario, tipo, mensaje, id_origen) VALUES (?,?,?,?)',
          [pub.id_usuario, 'like', `A ${autor.nombre} le gustó tu publicación`, idUsuario]
        );
      }
      res.json({ liked: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al procesar like' });
  }
};

// Stats del perfil propio
export const getMisStats = async (req, res) => {
  const id = req.usuario.id_usuario;
  try {
    const [[stats]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM seguimientos WHERE id_seguido  = ?) AS seguidores,
        (SELECT COUNT(*) FROM seguimientos WHERE id_seguidor = ?) AS seguidos,
        (SELECT COUNT(*) FROM resenas      WHERE id_usuario  = ?) AS resenas,
        (SELECT COUNT(*) FROM listas_lectura WHERE id_usuario= ? AND estado='leido') AS leidos,
        (SELECT COUNT(*) FROM listas_lectura WHERE id_usuario= ? AND estado='leyendo') AS leyendo,
        (SELECT COUNT(*) FROM listas_lectura WHERE id_usuario= ? AND estado='quiero_leer') AS quiero_leer`,
      [id, id, id, id, id, id]
    );
    res.json(stats);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error al obtener stats' });
  }
};
