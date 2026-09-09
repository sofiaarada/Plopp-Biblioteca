import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMiLista, getListaDeUsuario, upsertLista, quitarDeLista } from '../controllers/listaLecturaController.js';

const router = Router();
router.use(requireAuth);

router.get('/lista-lectura',         getMiLista);
router.get('/lista-lectura/:id',     getListaDeUsuario);
router.post('/lista-lectura',        upsertLista);
router.delete('/lista-lectura/:id',  quitarDeLista);

export default router;
