import db from '../config/db.js';

// Obtener el perfil (foto + bio) de un usuario, junto a sus datos básicos
export const getPerfil = async (req, res) => {
    try {
        const idUsuario = req.params.id;

        const [resultado] = await db.query(
            `SELECT u.id_usuario, u.nombre, u.correo,
                    p.foto_url, p.bio
             FROM usuarios u
             LEFT JOIN perfiles p ON p.id_usuario = u.id_usuario
             WHERE u.id_usuario = ?`,
            [idUsuario]
        );

        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'El usuario no existe' });
        }

        res.json(resultado[0]);
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Crear o actualizar la foto/bio de un usuario
export const guardarPerfil = async (req, res) => {
    try {
        const idUsuario = req.params.id;
        const { foto_url, bio } = req.body;

        const consulta = `
            INSERT INTO perfiles (id_usuario, foto_url, bio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE foto_url = VALUES(foto_url), bio = VALUES(bio)
        `;

        await db.query(consulta, [idUsuario, foto_url || null, bio || null]);

        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al guardar el perfil:', error);
        res.status(500).json({ mensaje: 'No se pudo guardar el perfil' });
    }
};
