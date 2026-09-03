import jwt from 'jsonwebtoken';

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