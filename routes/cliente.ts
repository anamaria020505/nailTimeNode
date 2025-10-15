import { Router } from 'express';
import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
  buscarClientes
} from '../controllers/cliente';

const router = Router();

// Rutas CRUD para clientes
router.post('/', crearCliente);                    // Crear cliente
router.get('/', obtenerClientes);                  // Obtener todos los clientes
router.get('/search', buscarClientes);             // Buscar clientes
router.get('/:id', obtenerClientePorId);           // Obtener cliente por ID
router.put('/:id', actualizarCliente);             // Actualizar cliente
router.delete('/:id', eliminarCliente);            // Eliminar cliente

export default router;
