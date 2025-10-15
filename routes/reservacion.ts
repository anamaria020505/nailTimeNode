import { Router } from 'express';
import {
  crearReservacion,
  obtenerReservaciones,
  obtenerReservacionPorId,
  obtenerReservacionesPorCliente,
  actualizarReservacion,
  cancelarReservacion,
  completarReservacion,
  obtenerEstadisticasReservaciones
} from '../controllers/reservacion';

const router = Router();

// Rutas CRUD para reservaciones
router.post('/', crearReservacion);                           // Crear reservación
router.get('/', obtenerReservaciones);                        // Obtener todas las reservaciones (con filtros)
router.get('/estadisticas', obtenerEstadisticasReservaciones); // Obtener estadísticas de reservaciones
router.get('/:id', obtenerReservacionPorId);                  // Obtener reservación por ID
router.get('/cliente/:clienteId', obtenerReservacionesPorCliente); // Obtener reservaciones por cliente
router.put('/:id', actualizarReservacion);                   // Actualizar reservación
router.patch('/:id/cancelar', cancelarReservacion);           // Cancelar reservación
router.patch('/:id/completar', completarReservacion);         // Completar reservación

export default router;
