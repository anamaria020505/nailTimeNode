import { Router } from 'express';
import {
  crearNotificacion,
  obtenerNotificaciones,
  obtenerNotificacionPorId,
  obtenerNotificacionesPorCliente,
  obtenerNotificacionesPorManicure,
  marcarNotificacionComoLeida,
  marcarNotificacionesComoLeidas,
  eliminarNotificacion,
  obtenerEstadisticasNotificaciones
} from '../controllers/notificacion';

const router = Router();

// Rutas CRUD para notificaciones
router.post('/', crearNotificacion);                           // Crear notificación
router.get('/', obtenerNotificaciones);                        // Obtener todas las notificaciones (con filtros)
router.get('/estadisticas', obtenerEstadisticasNotificaciones); // Obtener estadísticas de notificaciones
router.get('/:id', obtenerNotificacionPorId);                  // Obtener notificación por ID
router.get('/cliente/:clienteId', obtenerNotificacionesPorCliente); // Obtener notificaciones por cliente
router.get('/manicure/:manicureId', obtenerNotificacionesPorManicure); // Obtener notificaciones por manicure
router.patch('/:id/leida', marcarNotificacionComoLeida);       // Marcar notificación como leída
router.patch('/cliente/leidas', marcarNotificacionesComoLeidas); // Marcar múltiples notificaciones como leídas
router.delete('/:id', eliminarNotificacion);                   // Eliminar notificación

export default router;
