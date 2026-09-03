import { Router } from 'express';
import {
    getPublicaciones,
    crearPublicacion,
    eliminarPublicacion,
    getRespuestas,
    crearRespuesta,
} from '../controllers/comunidadController.js';

const router = Router();

router.get('/publicaciones', getPublicaciones);
router.post('/nuevaPublicacion', crearPublicacion);
router.delete('/eliminarPublicacion/:id', eliminarPublicacion);
router.get('/respuestas', getRespuestas);
router.post('/nuevaRespuesta', crearRespuesta);

export default router;
