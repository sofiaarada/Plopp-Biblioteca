
import db from '../config/db.js';


export const getPrestamos = async (req, res) => {
    try {
        const consulta = `
            SELECT 
                p.id_prestamo, 
                p.id_usuario,
                p.fecha_prestamo, 
                p.fecha_devolucion, 
                p.estado,
                u.nombre AS nombreUsuario,
                u.cedula AS cedulaUsuario,
                u.correo AS correoUsuario,
                dp.id_libro,
                l.titulo AS librosPrestados,
                l.autor,
                l.categoria,
                l.anio,
                l.portada,
                l.descripcion
            FROM prestamos p
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            JOIN detalle_prestamo dp ON p.id_prestamo = dp.id_prestamo
            JOIN libros l ON dp.id_libro = l.id_libro
        `;
        const [resultado] = await db.query(consulta);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener préstamos:", error);
        res.status(500).json({ mensaje: 'Error al consultar los préstamos' });
    }
};


export const getPrestamoById = async (req, res) => {
    try {
        const idPrestamo = req.params.id;
        const [resultado] = await db.query('SELECT * FROM prestamos WHERE id_prestamo = ?', [idPrestamo]);

        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró el préstamo' });
        }

        res.json(resultado[0]);
    } catch (error) {
        console.error("Error al buscar préstamo:", error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

export const createPrestamo = async (req, res) => {
    try {
        const id_usuario = req.body.id_usuario;
        const id_libro = req.body.id_libro;
        const fecha_prestamo = req.body.fecha_prestamo;
        const fecha_devolucion = req.body.fecha_devolucion;
        const estado = req.body.estado || 'Activo';

        const consultaPrestamo = 'INSERT INTO prestamos (id_usuario, fecha_prestamo, fecha_devolucion, estado) VALUES (?, ?, ?, ?)';
        const [resultadoPrestamo] = await db.query(consultaPrestamo, [id_usuario, fecha_prestamo, fecha_devolucion, estado]);
        
        const id_nuevo_prestamo = resultadoPrestamo.insertId;

        const consultaDetalle = 'INSERT INTO detalle_prestamo (id_prestamo, id_libro) VALUES (?, ?)';
        await db.query(consultaDetalle, [id_nuevo_prestamo, id_libro]);

        res.status(201).json({ 
            mensaje: 'Préstamo guardado con éxito', 
            id_nuevo_prestamo: id_nuevo_prestamo 
        });
    } catch (error) {
        console.error("Error al registrar préstamo:", error);
        res.status(500).json({ mensaje: 'No se pudo guardar el préstamo' });
    }
};


export const updatePrestamo = async (req, res) => {
    try {
        const idPrestamo = req.params.id;
        
        const id_usuario = req.body.id_usuario;
        const fecha_prestamo = String(req.body.fecha_prestamo || '').split('T')[0];
        const fecha_devolucion = String(req.body.fecha_devolucion || '').split('T')[0];
        const estado = req.body.estado;
        const id_libro = req.body.id_libro;

        if (!fecha_prestamo || !estado) {
            return res.status(400).json({ mensaje: 'fecha_prestamo y estado son obligatorios' });
        }

        const [existe] = await db.query('SELECT id_prestamo FROM prestamos WHERE id_prestamo = ?', [idPrestamo]);
        if (existe.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró el préstamo a actualizar' });
        }

        const consultaPrestamo = 'UPDATE prestamos SET id_usuario = ?, fecha_prestamo = ?, fecha_devolucion = ?, estado = ? WHERE id_prestamo = ?';
        await db.query(consultaPrestamo, [id_usuario, fecha_prestamo, fecha_devolucion || null, estado, idPrestamo]);

        if (id_libro) {
            const consultaDetalle = 'UPDATE detalle_prestamo SET id_libro = ? WHERE id_prestamo = ?';
            await db.query(consultaDetalle, [id_libro, idPrestamo]);
        }

        res.json({ mensaje: 'Datos del préstamo actualizados correctamente' });
    } catch (error) {
        console.error("Error al actualizar préstamo:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};



export const deletePrestamo = async (req, res) => {
    try {
        const idPrestamo = req.params.id;

        await db.query('DELETE FROM detalle_prestamo WHERE id_prestamo = ?', [idPrestamo]);

        const [resultado] = await db.query('DELETE FROM prestamos WHERE id_prestamo = ?', [idPrestamo]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'El préstamo no existe' });
        }

        res.json({ mensaje: 'Préstamo eliminado de la base de datos' });
    } catch (error) {
        console.error("Error al eliminar préstamo:", error);
        res.status(500).json({ mensaje: 'Error al intentar borrar el registro' });
    }
};
