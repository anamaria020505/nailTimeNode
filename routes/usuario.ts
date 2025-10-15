import { Router } from 'express';
import {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarContrasena,
  eliminarUsuario,
  autenticarUsuario,
  obtenerEstadisticasUsuarios
} from '../controllers/usuario';

const router = Router();

// Rutas públicas (autenticación)
router.post('/auth', autenticarUsuario);                    // Autenticar usuario (login)

// Rutas CRUD para usuarios (protegidas)
router.post('/', crearUsuario);                           // Crear usuario
router.get('/', obtenerUsuarios);                         // Obtener todos los usuarios (con filtros)
router.get('/estadisticas', obtenerEstadisticasUsuarios); // Obtener estadísticas de usuarios
router.get('/:id', obtenerUsuarioPorId);                  // Obtener usuario por ID
router.put('/:id', actualizarUsuario);                    // Actualizar usuario
router.patch('/:id/contrasena', cambiarContrasena);       // Cambiar contraseña
router.delete('/:id', eliminarUsuario);                   // Eliminar usuario

export default router;
