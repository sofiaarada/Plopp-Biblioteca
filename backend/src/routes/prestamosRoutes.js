import { Router } from 'express';
import { getPrestamos, getPrestamoById, createPrestamo, updatePrestamo, deletePrestamo } from '../controllers/prestamoController.js';

const router = Router();


router.get('/prestamos', getPrestamos);         
router.get('/prestamos/:id', getPrestamoById);  
router.post('/nuevoPrestamo', createPrestamo);     
router.put('/actualizarPrestamo/:id', updatePrestamo);     
router.delete('/eliminarPrestamo/:id', deletePrestamo); 

export default router;
