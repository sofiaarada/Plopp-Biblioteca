import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getConversaciones, getMensajes, enviarMensaje, getNoLeidos } from '../controllers/chatController.js';

const router = Router();

router.use(requireAuth);

router.get('/chat/conversaciones', getConversaciones);
router.get('/chat/no-leidos', getNoLeidos);
router.get('/chat/:id', getMensajes);
router.post('/chat/:id', enviarMensaje);

export default router;
