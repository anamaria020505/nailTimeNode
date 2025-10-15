import { Router } from 'express';
import {
  crearDisenno,
  obtenerDisennos,
  obtenerDisennoPorId,
  obtenerDisennosPorManicure,
  actualizarDisenno,
  eliminarDisenno,
  obtenerDisennosRecientes
} from '../controllers/disenno';

const router = Router();

// Rutas CRUD para diseños
router.post('/', crearDisenno);                           // Crear diseño
router.get('/', obtenerDisennos);                         // Obtener todos los diseños (con paginación y filtros)
router.get('/recent', obtenerDisennosRecientes);          // Obtener diseños recientes
router.get('/:id', obtenerDisennoPorId);                  // Obtener diseño por ID
router.get('/manicure/:manicureId', obtenerDisennosPorManicure); // Obtener diseños por manicure
router.put('/:id', actualizarDisenno);                    // Actualizar diseño
router.delete('/:id', eliminarDisenno);                   // Eliminar diseño

export default router;
