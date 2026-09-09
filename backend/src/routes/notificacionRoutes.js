import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getNotificaciones, marcarLeidas, getNoLeidas } from '../controllers/notificacionController.js';

const router = Router();
router.use(requireAuth);

router.get('/notificaciones',           getNotificaciones);
router.get('/notificaciones/no-leidas', getNoLeidas);
router.put('/notificaciones/leer',      marcarLeidas);

export default router;
