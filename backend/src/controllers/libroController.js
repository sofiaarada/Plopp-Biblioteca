
import db from '../config/db.js';

const ensureDescripcionColumn = async () => {
    const [columns] = await db.query(
        `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'libros' AND COLUMN_NAME = 'descripcion'`
    );
    if (Number(columns[0].total) === 0) {
        await db.query('ALTER TABLE libros ADD COLUMN descripcion TEXT NULL');
    }
};


export const getLibros = async (req, res) => {
    try {
        await ensureDescripcionColumn();
        
        const [resultado] = await db.query('SELECT * FROM libros');
        
        
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener libros:", error);
        res.status(500).json({ mensaje: 'Error al consultar los libros en la base de datos' });
    }
};


export const getLibroById = async (req, res) => {
    try {
        const idLibro = req.params.id; 

        
        const [resultado] = await db.query('SELECT * FROM libros WHERE id_libro = ?', [idLibro]);

        
        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'El libro no existe' });
        }

        
        res.json(resultado[0]);
    } catch (error) {
        console.error("Error al buscar libro:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};


export const createLibro = async (req, res) => {
    try {
    await ensureDescripcionColumn();
        
        const titulo = req.body.titulo;
        const autor = req.body.autor;
        const categoria = req.body.categoria;
        const anio = req.body.anio;
        const estado = req.body.estado;
        const portada = req.body.portada || null;
        const descripcion = req.body.descripcion || null;

        
        const consulta = 'INSERT INTO libros (titulo, autor, categoria, anio, estado, portada, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        
        const [resultado] = await db.query(consulta, [titulo, autor, categoria, anio, estado, portada, descripcion]);

        res.status(201).json({ 
            mensaje: 'Libro registrado exitosamente', 
            id_nuevo_libro: resultado.insertId 
        });
    } catch (error) {
        console.error("Error al registrar libro:", error);
        res.status(500).json({ mensaje: 'No se pudo registrar el libro' });
    }
};


export const updateLibro = async (req, res) => {
    try {
    await ensureDescripcionColumn();
        const idLibro = req.params.id;
        
        
        const titulo = req.body.titulo;
        const autor = req.body.autor;
        const categoria = req.body.categoria;
        const anio = req.body.anio;
        const estado = req.body.estado;
        const portada = req.body.portada || null;
        const descripcion = req.body.descripcion || null;

        const consulta = 'UPDATE libros SET titulo = ?, autor = ?, categoria = ?, anio = ?, estado = ?, portada = ?, descripcion = ? WHERE id_libro = ?';
        
        
        const [resultado] = await db.query(consulta, [titulo, autor, categoria, anio, estado, portada, descripcion, idLibro]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró el libro a modificar' });
        }

        res.json({ mensaje: 'Datos del libro actualizados correctamente' });
    } catch (error) {
        console.error("Error al actualizar libro:", error);
        res.status(500).json({ mensaje: 'Error al intentar actualizar el libro' });
    }
};


export const deleteLibro = async (req, res) => {
    try {
        const idLibro = req.params.id;

        
        const [resultado] = await db.query('DELETE FROM libros WHERE id_libro = ?', [idLibro]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'El libro no existe, no se puede borrar' });
        }

        res.json({ mensaje: 'Libro eliminado con éxito' });
    } catch (error) {
        console.error("Error al eliminar libro:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
