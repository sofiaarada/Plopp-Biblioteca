import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

import usuarioRoutes      from './src/routes/usuarioRoutes.js';
import librosRoutes       from './src/routes/librosRoutes.js';
import prestamosRoutes    from './src/routes/prestamosRoutes.js';
import cuentasRoutes      from './src/routes/cuentasRoutes.js';
import perfilRoutes       from './src/routes/perfilRoutes.js';
import resenasRoutes      from './src/routes/resenasRoutes.js';
import comunidadRoutes    from './src/routes/comunidadRoutes.js';
import socialRoutes       from './src/routes/socialRoutes.js';
import chatRoutes         from './src/routes/chatRoutes.js';
import notificacionRoutes from './src/routes/notificacionRoutes.js';
import listaLecturaRoutes from './src/routes/listaLecturaRoutes.js';
import { initializeCommunityTables } from './src/config/initCommunity.js';
import db from './src/config/db.js';

const app        = express();
const httpServer = createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const usuariosConectados = new Map();

io.on('connection', (socket) => {
  socket.on('registrar', (idUsuario) => {
    usuariosConectados.set(String(idUsuario), socket.id);
    socket.join(`user_${idUsuario}`);
  });

  socket.on('mensaje_privado', ({ idReceptor, mensaje }) => {
    io.to(`user_${idReceptor}`).emit('mensaje_nuevo', mensaje);
  });

  socket.on('disconnect', () => {
    for (const [id, sid] of usuariosConectados) {
      if (sid === socket.id) { usuariosConectados.delete(id); break; }
    }
  });
});

// Exportar io para usarlo en controllers si se necesita
export { io };

// ── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a la API de la Biblioteca El Ferry</h1>');
});

// ── Google OAuth endpoint ───────────────────────────────────────────────────
// OJO: debe ir ANTES de montar los routers, porque algunos routers (chat,
// social, etc.) usan requireAuth global y bloquearían esta ruta pública.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name  = payload.name;

    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [email]);
    let lector = rows[0];

    if (!lector) {
      const cedulaTemporal = `google-${String(Date.now()).slice(-8)}`;
      const [result] = await db.query(
        'INSERT INTO usuarios (nombre, cedula, correo, telefono, password) VALUES (?, ?, ?, ?, ?)',
        [name, cedulaTemporal, email, '', '']
      );
      lector = { id_usuario: result.insertId, nombre: name, correo: email };
    }

    const sessionToken = jwt.sign(
      { id_usuario: lector.id_usuario, nombre_usuario: lector.nombre, correo: lector.correo, rol: 'usuario' },
      process.env.JWT_SECRET || 'biblioteca_ferry_secret_2026',
      { expiresIn: '8h' }
    );

    res.json({
      token: sessionToken,
      usuario: {
        id_cuenta:      null,
        id_usuario:     lector.id_usuario,
        nombre_usuario: lector.nombre,
        correo:         lector.correo,
        rol:            'usuario',
      },
    });
  } catch (error) {
    console.error('Error al verificar el token de Google:', error);
    res.status(401).json({ error: 'Token de Google no válido o expirado' });
  }
});
// ── Fin Google OAuth ────────────────────────────────────────────────────────

app.use('/api', usuarioRoutes);
app.use('/api', librosRoutes);
app.use('/api', prestamosRoutes);
app.use('/api', cuentasRoutes);
app.use('/api', perfilRoutes);
app.use('/api', resenasRoutes);
app.use('/api', comunidadRoutes);
app.use('/api', socialRoutes);
app.use('/api', chatRoutes);
app.use('/api', notificacionRoutes);
app.use('/api', listaLecturaRoutes);

const PORT = process.env.PORT || 4000;

initializeCommunityTables()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor Plopp corriendo en http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO activo`);
    });
  })
  .catch((error) => {
    console.error('No se pudieron inicializar las tablas de comunidad:', error);
    process.exit(1);
  });