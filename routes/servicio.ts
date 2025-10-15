import { Router } from 'express';
import {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  obtenerServiciosPorManicure,
  actualizarServicio,
  eliminarServicio,
  cambiarDisponibilidadServicio,
  obtenerServiciosDisponibles,
  obtenerEstadisticasServicios
} from '../controllers/servicio';

const router = Router();

// Rutas CRUD para servicios
router.post('/', crearServicio);                           // Crear servicio
router.get('/', obtenerServicios);                         // Obtener todos los servicios (con filtros)
router.get('/disponibles', obtenerServiciosDisponibles);   // Obtener servicios disponibles
router.get('/estadisticas', obtenerEstadisticasServicios); // Obtener estadísticas de servicios
router.get('/:id', obtenerServicioPorId);                 // Obtener servicio por ID
router.get('/manicure/:manicureId', obtenerServiciosPorManicure); // Obtener servicios por manicure
router.put('/:id', actualizarServicio);                   // Actualizar servicio
router.patch('/:id/disponibilidad', cambiarDisponibilidadServicio); // Cambiar disponibilidad
router.delete('/:id', eliminarServicio);                  // Eliminar servicio

export default router;
