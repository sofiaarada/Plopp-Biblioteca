import db from '../config/db.js';

export const getRespuestas = async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT r.id_respuesta, r.tipo_origen, r.id_origen, r.contenido, r.fecha,
                    u.id_usuario, u.nombre AS nombre_usuario, p.foto_url
             FROM respuestas_comunidad r
             JOIN usuarios u ON u.id_usuario = r.id_usuario
             LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
             ORDER BY r.fecha ASC`
        );
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener respuestas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

export const crearRespuesta = async (req, res) => {
    try {
        const { id_usuario, tipo_origen, id_origen, contenido } = req.body;
        if (!id_usuario || !['publicacion', 'resena'].includes(tipo_origen) || !id_origen || !contenido?.trim()) {
            return res.status(400).json({ mensaje: 'Usuario, origen y contenido son obligatorios' });
        }
        const [resultado] = await db.query(
            'INSERT INTO respuestas_comunidad (id_usuario, tipo_origen, id_origen, contenido) VALUES (?, ?, ?, ?)',
            [id_usuario, tipo_origen, id_origen, contenido.trim()]
        );
        res.status(201).json({ mensaje: 'Respuesta publicada', id_respuesta: resultado.insertId });
    } catch (error) {
        console.error('Error al crear respuesta:', error);
        res.status(500).json({ mensaje: 'No se pudo publicar la respuesta' });
    }
};

export const getPublicaciones = async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT pub.id_publicacion, pub.contenido, pub.fecha,
                    u.id_usuario, u.nombre AS nombre_usuario, p.foto_url,
                    l.id_libro, l.titulo, l.autor, l.portada
             FROM publicaciones pub
             JOIN usuarios u ON u.id_usuario = pub.id_usuario
             LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
             LEFT JOIN libros l ON l.id_libro = pub.id_libro
             ORDER BY pub.fecha DESC
             LIMIT 50`
        );
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

export const crearPublicacion = async (req, res) => {
    try {
        const { id_usuario, id_libro, contenido } = req.body;

        if (!id_usuario || !contenido) {
            return res.status(400).json({ mensaje: 'Usuario y contenido son obligatorios' });
        }

        const [resultado] = await db.query(
            'INSERT INTO publicaciones (id_usuario, id_libro, contenido) VALUES (?, ?, ?)',
            [id_usuario, id_libro || null, contenido]
        );

        res.status(201).json({ mensaje: 'Publicación creada', id_publicacion: resultado.insertId });
    } catch (error) {
        console.error('Error al crear la publicación:', error);
        res.status(500).json({ mensaje: 'No se pudo publicar' });
    }
};

export const eliminarPublicacion = async (req, res) => {
    try {
        const idPublicacion = req.params.id;
        const [resultado] = await db.query('DELETE FROM publicaciones WHERE id_publicacion = ?', [idPublicacion]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'La publicación no existe' });
        }
        res.json({ mensaje: 'Publicación eliminada' });
    } catch (error) {
        console.error('Error al eliminar la publicación:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};
