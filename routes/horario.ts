import { Router } from 'express';
import {
  crearHorario,
  obtenerHorarios,
  obtenerHorarioPorId,
  obtenerHorariosPorManicure,
  actualizarHorario,
  eliminarHorario,
  obtenerHorariosDisponibles
} from '../controllers/horario';

const router = Router();

// Rutas CRUD para horarios
router.post('/', crearHorario);                           // Crear horario
router.get('/', obtenerHorarios);                         // Obtener todos los horarios (con filtros)
router.get('/:id', obtenerHorarioPorId);                  // Obtener horario por ID
router.get('/manicure/:manicureId', obtenerHorariosPorManicure); // Obtener horarios por manicure
router.get('/manicure/:manicureId/disponibles', obtenerHorariosDisponibles); // Obtener horarios disponibles
router.put('/:id', actualizarHorario);                    // Actualizar horario
router.delete('/:id', eliminarHorario);                   // Eliminar horario

export default router;
