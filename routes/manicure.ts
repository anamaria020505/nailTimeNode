import { Router } from 'express';
import {
  crearManicure,
  obtenerManicures,
  obtenerManicurePorId,
  actualizarManicure,
  eliminarManicure,
  buscarManicuresPorUbicacion,
  obtenerEstadisticasManicures
} from '../controllers/manicure';

const router = Router();

// Rutas CRUD para manicures
router.post('/', crearManicure);                           // Crear manicure
router.get('/', obtenerManicures);                         // Obtener todas las manicures (con filtros)
router.get('/estadisticas', obtenerEstadisticasManicures); // Obtener estadísticas de manicures
router.get('/ubicacion', buscarManicuresPorUbicacion);     // Buscar manicures por ubicación
router.get('/:id', obtenerManicurePorId);                  // Obtener manicure por ID
router.put('/:id', actualizarManicure);                    // Actualizar manicure
router.delete('/:id', eliminarManicure);                   // Eliminar manicure

export default router;
