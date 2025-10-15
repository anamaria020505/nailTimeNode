import { Router } from 'express';
import {
  crearRelacionClienteManicure,
  obtenerRelacionesClienteManicure,
  obtenerRelacionesPorCliente,
  obtenerRelacionesPorManicure,
  verificarRelacionClienteManicure,
  eliminarRelacionClienteManicure,
  obtenerClientesPorManicure,
  obtenerManicuresPorCliente
} from '../controllers/clienteManicure';

const router = Router();

// Rutas para relaciones cliente-manicure
router.post('/', crearRelacionClienteManicure);                    // Crear relación cliente-manicure
router.get('/', obtenerRelacionesClienteManicure);                 // Obtener todas las relaciones
router.get('/verify', verificarRelacionClienteManicure);           // Verificar relación específica
router.delete('/', eliminarRelacionClienteManicure);               // Eliminar relación específica

// Rutas por cliente
router.get('/cliente/:clienteId', obtenerRelacionesPorCliente);    // Obtener relaciones de un cliente
router.get('/cliente/:clienteId/manicures', obtenerManicuresPorCliente); // Obtener manicures de un cliente

// Rutas por manicure
router.get('/manicure/:manicureId', obtenerRelacionesPorManicure); // Obtener relaciones de una manicure
router.get('/manicure/:manicureId/clientes', obtenerClientesPorManicure); // Obtener clientes de una manicure

export default router;
