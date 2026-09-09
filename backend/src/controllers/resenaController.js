import db from '../config/db.js';

// Reseñas de un libro específico
export const getResenasPorLibro = async (req, res) => {
    try {
        const idLibro = req.params.id;

        const [resenas] = await db.query(
            `SELECT r.id_resena, r.calificacion, r.comentario, r.fecha,
                    u.id_usuario, u.nombre AS nombre_usuario, p.foto_url
             FROM resenas r
             JOIN usuarios u ON u.id_usuario = r.id_usuario
             LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
             WHERE r.id_libro = ?
             ORDER BY r.fecha DESC`,
            [idLibro]
        );

        const [[promedio]] = await db.query(
            `SELECT ROUND(AVG(calificacion), 1) AS promedio, COUNT(*) AS total
             FROM resenas WHERE id_libro = ?`,
            [idLibro]
        );

        res.json({ resenas, promedio: promedio.promedio || 0, total: promedio.total || 0 });
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Todas las reseñas recientes
export const getResenasComunidad = async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT r.id_resena, r.calificacion, r.comentario, r.fecha,
                    u.id_usuario, u.nombre AS nombre_usuario, p.foto_url,
                    l.id_libro, l.titulo, l.autor, l.portada
             FROM resenas r
             JOIN usuarios u ON u.id_usuario = r.id_usuario
             LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
             JOIN libros l ON l.id_libro = r.id_libro
             ORDER BY r.fecha DESC
             LIMIT 50`
        );
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener el feed de reseñas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

export const crearResena = async (req, res) => {
    try {
        const { id_usuario, id_libro, calificacion, comentario } = req.body;

        if (!id_usuario || !id_libro || !calificacion) {
            return res.status(400).json({ mensaje: 'Usuario, libro y calificación son obligatorios' });
        }
        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ mensaje: 'La calificación debe estar entre 1 y 5 estrellas' });
        }

        const [resultado] = await db.query(
            'INSERT INTO resenas (id_usuario, id_libro, calificacion, comentario) VALUES (?, ?, ?, ?)',
            [id_usuario, id_libro, calificacion, comentario || null]
        );

        res.status(201).json({ mensaje: 'Reseña publicada', id_resena: resultado.insertId });
    } catch (error) {
        console.error('Error al crear la reseña:', error);
        res.status(500).json({ mensaje: 'No se pudo publicar la reseña' });
    }
};

export const eliminarResena = async (req, res) => {
    try {
        const idResena = req.params.id;
        const [resultado] = await db.query('DELETE FROM resenas WHERE id_resena = ?', [idResena]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'La reseña no existe' });
        }
        res.json({ mensaje: 'Reseña eliminada' });
    } catch (error) {
        console.error('Error al eliminar la reseña:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};
