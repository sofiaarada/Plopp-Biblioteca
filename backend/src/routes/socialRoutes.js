import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  seguirUsuario, dejarDeSeguir,
  getSeguidores, getSeguidos,
  getFeedSocial, buscarUsuarios,
  getPerfilPublico, toggleLike, getMisStats,
} from '../controllers/socialController.js';

const router = Router();

router.use(requireAuth);

router.post('/social/seguir/:id',        seguirUsuario);
router.delete('/social/seguir/:id',      dejarDeSeguir);
router.get('/social/seguidores/:id',     getSeguidores);
router.get('/social/seguidos/:id',       getSeguidos);
router.get('/social/feed',               getFeedSocial);
router.get('/social/buscar',             buscarUsuarios);
router.get('/social/perfil/:id',         getPerfilPublico);
router.post('/social/like/:id',          toggleLike);
router.get('/social/mis-stats',          getMisStats);

export default router;
