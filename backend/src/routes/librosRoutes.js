import { Router } from 'express';
import { getLibros, getLibroById, createLibro, updateLibro, deleteLibro } from '../controllers/libroController.js';

const router = Router();


router.get('/libros', getLibros);          
router.get('/libros/:id', getLibroById);   
router.post('/nuevoLibro', createLibro);        
router.put('/actualizarLibro/:id', updateLibro);      
router.delete('/eliminarLibro/:id', deleteLibro);   

export default router;
    