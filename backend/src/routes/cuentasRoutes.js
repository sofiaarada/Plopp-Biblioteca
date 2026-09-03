import { Router } from 'express';
import { getCuentas, getCuentaById, createCuenta, updateCuenta, deleteCuenta, loginCuenta, loginSocial } from '../controllers/cuentaController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Login (público)
router.post('/login', loginCuenta);
router.post('/loginSocial', loginSocial);

// Todas las rutas de cuentas del sistema son exclusivas del administrador
router.get('/cuentas', requireAdmin, getCuentas);
router.get('/cuentas/:id', requireAdmin, getCuentaById);
router.post('/nuevaCuenta', requireAdmin, createCuenta);
router.put('/actualizarCuenta/:id', requireAdmin, updateCuenta);
router.delete('/eliminarCuenta/:id', requireAdmin, deleteCuenta);

export default router;