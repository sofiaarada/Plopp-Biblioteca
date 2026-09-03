import { Router } from 'express';
import {
    getResenasPorLibro,
    getResenasComunidad,
    crearResena,
    eliminarResena,
} from '../controllers/resenaController.js';

const router = Router();

router.get('/resenas', getResenasComunidad);
router.get('/resenas/libro/:id', getResenasPorLibro);
router.post('/nuevaResena', crearResena);
router.delete('/eliminarResena/:id', eliminarResena);

export default router;
