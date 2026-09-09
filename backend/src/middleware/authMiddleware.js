import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'biblioteca_ferry_secret_2026';

export const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};

export const verifyToken = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ mensaje: 'No autorizado: falta el token' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'No autorizado: sesión inválida o expirada' });
    }
};

export const requireAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ mensaje: 'Solo el administrador puede realizar esta acción' });
        }
        next();
    });
};

// Middleware para cualquier usuario autenticado
export const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ mensaje: 'No autorizado: falta el token' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        let idUsuario = payload.id_usuario ?? payload.id ?? null;

        if (!idUsuario && payload.correo) {
            try {
                const [rows] = await db.query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [payload.correo]);
                if (rows.length > 0) {
                    idUsuario = rows[0].id_usuario;
                }
            } catch (err) {
                console.error('Error buscando id_usuario en requireAuth:', err);
            }
        }

        req.usuario = {
            id_usuario:    idUsuario,
            id_cuenta:     payload.id_cuenta ?? null,
            correo:        payload.correo,
            rol:           payload.rol,
            nombre_usuario: payload.nombre_usuario,
        };
        next();
    } catch {
        return res.status(401).json({ mensaje: 'No autorizado: sesión inválida o expirada' });
    }
};