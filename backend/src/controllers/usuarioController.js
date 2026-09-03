
import bcrypt from 'bcryptjs';
import db from '../config/db.js';


export const getUsuarios = async (req, res) => {
    try {
        
        const [resultado] = await db.query('SELECT * FROM usuarios');
        res.json(resultado);

    } catch (error) {
        
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};


export const getUsuarioById = async (req, res) => {
    try {
        
        const idUsuario = req.params.id;

        
        const [resultado] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [idUsuario]);

        
        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'El usuario no fue encontrado' });
        }

        
        res.json(resultado[0]);

    } catch (error) {
        console.error("Error al buscar usuario:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};


export const createUsuario = async (req, res) => {
    try {
        
        const nombre = req.body.nombre;
        const cedula = req.body.cedula;
        const correo = req.body.correo;
        const telefono = req.body.telefono;
        const password = req.body.password || '';

        
        if (!nombre || !cedula || !correo || !telefono) {
            return res.status(400).json({ mensaje: 'Nombre, cédula, correo y teléfono son obligatorios' });
        }

        
        const [existeCorreo] = await db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
        if (existeCorreo.length > 0) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario registrado con ese correo' });
        }

        const [existeCedula] = await db.query('SELECT id_usuario FROM usuarios WHERE cedula = ?', [cedula]);
        if (existeCedula.length > 0) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario registrado con esa cédula' });
        }

        const contraseña = password ? await bcrypt.hash(password, 10) : '';
        const consulta = 'INSERT INTO usuarios (nombre, cedula, correo, telefono, contraseña) VALUES (?, ?, ?, ?, ?)';
        
        
        const [resultado] = await db.query(consulta, [nombre, cedula, correo, telefono, contraseña]);

        
        res.status(201).json({ 
            mensaje: 'Lector registrado con éxito', 
            id_nuevo_usuario: resultado.insertId 
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ mensaje: 'Error al registrar el usuario' });
    }
};


export const updateUsuario = async (req, res) => {
    try {
        const idUsuario = req.params.id; 
        
        
        const nombre = req.body.nombre;
        const cedula = req.body.cedula;
        const correo = req.body.correo;
        const telefono = req.body.telefono;

        
        const consulta = 'UPDATE usuarios SET nombre = ?, cedula = ?, correo = ?, telefono = ? WHERE id_usuario = ?';
        
        
        const [resultado] = await db.query(consulta, [nombre, cedula, correo, telefono, idUsuario]);

        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar porque el usuario no existe' });
        }

        res.json({ mensaje: 'Datos del usuario actualizados correctamente' });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};


export const deleteUsuario = async (req, res) => {
    try {
        const idUsuario = req.params.id;

        
        const [resultado] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [idUsuario]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'El usuario no existe, no se puede eliminar' });
        }

        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};
