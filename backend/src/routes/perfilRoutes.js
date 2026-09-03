import { Router } from 'express';
import { getPerfil, guardarPerfil } from '../controllers/perfilController.js';

const router = Router();

router.get('/perfil/:id', getPerfil);
router.put('/perfil/:id', guardarPerfil);

export default router;
