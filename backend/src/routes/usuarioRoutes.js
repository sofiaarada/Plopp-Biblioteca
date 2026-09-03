
import { Router } from 'express';


import { getUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarioController.js';


const router = Router();



// Mostrar usuarios
router.get('/usuarios', getUsuarios);

//Mostrar usuario por id
router.get('/usuarios/:id', getUsuarioById);

//Crear usuario
router.post('/nuevoUsuario', createUsuario);

//Actualizar usuario
router.put('/actualizarUsuario/:id', updateUsuario);

//Delete
router.delete('/eliminarUsuario/:id', deleteUsuario);


export default router;
