import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { signToken } from '../middleware/authMiddleware.js';

const verificarPassword = async (password, hashAlmacenado) => {
    if (!hashAlmacenado) return false;
    if (hashAlmacenado.startsWith('$2')) {
        return bcrypt.compare(password, hashAlmacenado);
    }
    return password === hashAlmacenado;
};

// Obtener todas las cuentas (sin mostrar contraseña)
export const getCuentas = async (req, res) => {
    try {
        const [resultado] = await db.query(
            'SELECT id_cuenta, nombre_usuario, correo, rol, fecha_creacion FROM cuentas_sistema'
        );
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Obtener una cuenta por ID
export const getCuentaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(
            'SELECT id_cuenta, nombre_usuario, correo, rol, fecha_creacion FROM cuentas_sistema WHERE id_cuenta = ?',
            [id]
        );
        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
        }
        res.json(resultado[0]);
    } catch (error) {
        console.error('Error al buscar cuenta:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Crear nueva cuenta
export const createCuenta = async (req, res) => {
    try {
        const { nombre_usuario, correo, password, rol } = req.body;

        if (!nombre_usuario || !correo || !password || !rol) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        const rolesValidos = ['admin', 'bibliotecario', 'usuario'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ mensaje: 'Rol no válido. Use: admin, bibliotecario o usuario' });
        }

        // Verificar correo duplicado
        const [existe] = await db.query(
            'SELECT id_cuenta FROM cuentas_sistema WHERE correo = ?',
            [correo]
        );
        if (existe.length > 0) {
            return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo' });
        }

        const hash = await bcrypt.hash(password, 10);

        const [resultado] = await db.query(
            'INSERT INTO cuentas_sistema (nombre_usuario, correo, password, rol) VALUES (?, ?, ?, ?)',
            [nombre_usuario, correo, hash, rol]
        );

        res.status(201).json({
            mensaje: 'Cuenta creada con éxito',
            id_nueva_cuenta: resultado.insertId
        });
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        res.status(500).json({ mensaje: 'Error al registrar la cuenta' });
    }
};

// Actualizar cuenta
export const updateCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_usuario, correo, rol } = req.body;

        const rolesValidos = ['admin', 'bibliotecario', 'usuario'];
        if (rol && !rolesValidos.includes(rol)) {
            return res.status(400).json({ mensaje: 'Rol no válido' });
        }

        const [resultado] = await db.query(
            'UPDATE cuentas_sistema SET nombre_usuario = ?, correo = ?, rol = ? WHERE id_cuenta = ?',
            [nombre_usuario, correo, rol, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
        }

        res.json({ mensaje: 'Cuenta actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Login con Google
export const loginSocial = async (req, res) => {
    try {
        const { correo, nombre, proveedor } = req.body;

        if (!correo || !nombre) {
            return res.status(400).json({ mensaje: 'Correo y nombre son obligatorios' });
        }

        const [existentes] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        let lector = existentes[0];

        if (!lector) {
            // cedula única y corta (máx 20 chars que permite la BD)
            const cedulaTemporal = `${proveedor || 'social'}-${String(Date.now()).slice(-8)}`;
            const passwordAleatorio = await bcrypt.hash(`${correo}-${Date.now()}`, 10);

            const [creado] = await db.query(
                'INSERT INTO usuarios (nombre, cedula, correo, telefono, password) VALUES (?, ?, ?, ?, ?)',
                [nombre, cedulaTemporal, correo, '', passwordAleatorio]
            );

            lector = { id_usuario: creado.insertId, nombre, correo };
        }

        const token = signToken({
            id_cuenta: null,
            id_usuario: lector.id_usuario,
            nombre_usuario: lector.nombre,
            correo: lector.correo,
            rol: 'usuario',
        });

        res.json({
            mensaje: 'Login social exitoso',
            token,
            usuario: {
                id_cuenta: null,
                id_usuario: lector.id_usuario,
                nombre_usuario: lector.nombre,
                correo: lector.correo,
                rol: 'usuario',
            },
        });
    } catch (error) {
        console.error('Error en login social:', error);
        res.status(500).json({ mensaje: 'No se pudo iniciar sesión con el proveedor' });
    }
};

export const loginCuenta = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
        }

        const [resultado] = await db.query(
            'SELECT id_cuenta, nombre_usuario, correo, rol, password FROM cuentas_sistema WHERE correo = ?',
            [correo]
        );

        let cuenta = resultado[0];

        if (!cuenta) {
            const [lectores] = await db.query(
                'SELECT id_usuario, nombre, correo, password FROM usuarios WHERE correo = ?',
                [correo]
            );

            if (lectores.length === 0) {
                return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
            }

            const lector = lectores[0];
            const passwordValido = await verificarPassword(password, lector.password);
            if (!passwordValido) {
                return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
            }

            const token = signToken({
                id_cuenta: null,
                id_usuario: lector.id_usuario,
                nombre_usuario: lector.nombre,
                correo: lector.correo,
                rol: 'usuario'
            });

            return res.json({
                mensaje: 'Login exitoso',
                token,
                usuario: {
                    id_cuenta: null,
                    id_usuario: lector.id_usuario,
                    nombre_usuario: lector.nombre,
                    correo: lector.correo,
                    rol: 'usuario'
                }
            });
        }

        const passwordValido = await verificarPassword(password, cuenta.password);
        if (!passwordValido) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        let idUsuario = null;

        // Los usuarios con rol "usuario" tienen un perfil de lector en la tabla usuarios
        if (cuenta.rol === 'usuario') {
            const [lector] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE correo = ?',
                [cuenta.correo]
            );

            if (lector.length === 0) {
                const hash = await bcrypt.hash(password, 10);
                const [nuevoLector] = await db.query(
                    'INSERT INTO usuarios (nombre, correo, telefono, password) VALUES (?, ?, ?, ?)',
                    [cuenta.nombre_usuario, cuenta.correo, '', hash]
                );
                idUsuario = nuevoLector.insertId;
            } else {
                idUsuario = lector[0].id_usuario;
            }
        }

        const token = signToken({
            id_cuenta: cuenta.id_cuenta,
            id_usuario: idUsuario,
            nombre_usuario: cuenta.nombre_usuario,
            correo: cuenta.correo,
            rol: cuenta.rol
        });

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id_cuenta:      cuenta.id_cuenta,
                id_usuario:     idUsuario,
                nombre_usuario: cuenta.nombre_usuario,
                correo:         cuenta.correo,
                rol:            cuenta.rol,
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Eliminar cuenta
export const deleteCuenta = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await db.query(
            'DELETE FROM cuentas_sistema WHERE id_cuenta = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
        }

        res.json({ mensaje: 'Cuenta eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};