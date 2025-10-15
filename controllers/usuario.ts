import { Request, Response } from 'express';
import Usuario from '../models/usuario';
import Cliente from '../models/cliente';
import Manicure from '../models/manicure';
import bcrypt from 'bcryptjs';

// Interface para los tipos de request
interface UsuarioRequest extends Request {
  body: {
    usuario: string;
    nombre: string;
    contrasena: string;
    rol: string;
  };
  params: {
    id: string;
  };
  query: {
    rol?: string;
    nombre?: string;
    usuario?: string;
    limit?: string;
    offset?: string;
  };
}

// Función auxiliar para hashear contraseñas
async function hashearContrasena(contrasena: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(contrasena, saltRounds);
}

// Función auxiliar para validar contraseñas
async function validarContrasena(contrasena: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(contrasena, hash);
}

// Crear usuario
export const crearUsuario = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { usuario, nombre, contrasena, rol } = req.body;

    // Validar campos requeridos
    if (!usuario || !nombre || !contrasena || !rol) {
      res.status(400).json({
        error: 'Campos requeridos',
        mensaje: 'Todos los campos (usuario, nombre, contrasena, rol) son requeridos'
      });
      return;
    }

    // Validar rol permitido
    const rolesPermitidos = ['cliente', 'manicure', 'admin'];
    if (!rolesPermitidos.includes(rol)) {
      res.status(400).json({
        error: 'Rol inválido',
        mensaje: `El rol debe ser uno de: ${rolesPermitidos.join(', ')}`
      });
      return;
    }

    // Verificar si ya existe un usuario con ese username
    const usuarioExistente = await Usuario.findByPk(usuario);
    if (usuarioExistente) {
      res.status(409).json({
        error: 'Usuario ya existe',
        mensaje: 'Ya existe un usuario con ese nombre de usuario'
      });
      return;
    }

    // Hashear la contraseña
    const contrasenaHasheada = await hashearContrasena(contrasena);

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      usuario,
      nombre,
      contrasena: contrasenaHasheada,
      rol
    });

    // Crear perfil específico según el rol
    try {
      if (rol === 'cliente') {
        await Cliente.create({
          idusuario: usuario,
          nombre,
          telefono: '' // Será actualizado después
        });
      } else if (rol === 'manicure') {
        await Manicure.create({
          idusuario: usuario,
          nombre,
          telefono: '' // Será actualizado después
        });
      }
    } catch (error) {
      // Si falla la creación del perfil específico, eliminar el usuario creado
      await nuevoUsuario.destroy();
      throw error;
    }

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        usuario: nuevoUsuario.usuario,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
        createdAt: nuevoUsuario.createdAt
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear el usuario'
    });
  }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', rol, nombre, usuario: usuarioQuery } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition: any = {};
    if (rol) whereCondition.rol = rol;
    if (nombre) {
      whereCondition.nombre = { [require('sequelize').Op.like]: `%${nombre}%` };
    }
    if (usuarioQuery) {
      whereCondition.usuario = { [require('sequelize').Op.like]: `%${usuarioQuery}%` };
    }

    const usuarios = await Usuario.findAll({
      where: whereCondition,
      attributes: ['usuario', 'nombre', 'rol', 'createdAt', 'updatedAt'], // Excluir contraseña
      order: [['nombre', 'ASC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Usuario.count({ where: whereCondition });

    res.status(200).json({
      usuarios,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total,
      filtros: {
        rol,
        nombre,
        usuario: usuarioQuery
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los usuarios'
    });
  }
};

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: ['usuario', 'nombre', 'rol', 'createdAt', 'updatedAt'] // Excluir contraseña
    });

    if (!usuario) {
      res.status(404).json({
        error: 'Usuario no encontrado',
        mensaje: 'No existe un usuario con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      usuario
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener el usuario'
    });
  }
};

// Actualizar usuario
export const actualizarUsuario = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, contrasena, rol } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuario no encontrado',
        mensaje: 'No existe un usuario con el ID especificado'
      });
      return;
    }

    // Validar rol si se proporciona
    if (rol && !['cliente', 'manicure', 'admin'].includes(rol)) {
      res.status(400).json({
        error: 'Rol inválido',
        mensaje: 'El rol debe ser cliente, manicure o admin'
      });
      return;
    }

    // Preparar datos para actualizar
    const datosActualizar: any = {
      nombre: nombre || usuario.nombre,
      rol: rol || usuario.rol
    };

    // Si se proporciona nueva contraseña, hashearla
    if (contrasena) {
      datosActualizar.contrasena = await hashearContrasena(contrasena);
    }

    // Actualizar usuario
    await usuario.update(datosActualizar);

    res.status(200).json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: {
        usuario: usuario.usuario,
        nombre: usuario.nombre,
        rol: usuario.rol,
        updatedAt: usuario.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar el usuario'
    });
  }
};

// Cambiar contraseña de usuario
export const cambiarContrasena = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contrasenaActual, nuevaContrasena } = req.body;

    if (!contrasenaActual || !nuevaContrasena) {
      res.status(400).json({
        error: 'Campos requeridos',
        mensaje: 'Debe proporcionar la contraseña actual y la nueva contraseña'
      });
      return;
    }

    if (nuevaContrasena.length < 6) {
      res.status(400).json({
        error: 'Contraseña muy corta',
        mensaje: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuario no encontrado',
        mensaje: 'No existe un usuario con el ID especificado'
      });
      return;
    }

    // Verificar contraseña actual
    const contrasenaValida = await validarContrasena(contrasenaActual, usuario.contrasena);
    if (!contrasenaValida) {
      res.status(401).json({
        error: 'Contraseña incorrecta',
        mensaje: 'La contraseña actual proporcionada es incorrecta'
      });
      return;
    }

    // Hashear nueva contraseña y actualizar
    const nuevaContrasenaHasheada = await hashearContrasena(nuevaContrasena);
    await usuario.update({ contrasena: nuevaContrasenaHasheada });

    res.status(200).json({
      mensaje: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo cambiar la contraseña'
    });
  }
};

// Eliminar usuario
export const eliminarUsuario = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuario no encontrado',
        mensaje: 'No existe un usuario con el ID especificado'
      });
      return;
    }

    // Verificar si el usuario tiene perfiles asociados
    const tieneCliente = await Cliente.findByPk(id);
    const tieneManicure = await Manicure.findByPk(id);

    if (tieneCliente) {
      await tieneCliente.destroy();
    }

    if (tieneManicure) {
      await tieneManicure.destroy();
    }

    await usuario.destroy();

    res.status(200).json({
      mensaje: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar el usuario'
    });
  }
};

// Autenticar usuario (login)
export const autenticarUsuario = async (req: UsuarioRequest, res: Response): Promise<void> => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      res.status(400).json({
        error: 'Credenciales requeridas',
        mensaje: 'Debe proporcionar usuario y contraseña'
      });
      return;
    }

    const usuarioEncontrado = await Usuario.findByPk(usuario);

    if (!usuarioEncontrado) {
      res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Usuario o contraseña incorrectos'
      });
      return;
    }

    // Verificar contraseña
    const contrasenaValida = await validarContrasena(contrasena, usuarioEncontrado.contrasena);
    if (!contrasenaValida) {
      res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Usuario o contraseña incorrectos'
      });
      return;
    }

    res.status(200).json({
      mensaje: 'Autenticación exitosa',
      usuario: {
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol
      }
    });

  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo autenticar el usuario'
    });
  }
};

// Obtener estadísticas de usuarios
export const obtenerEstadisticasUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsuarios = await Usuario.count();

    const usuariosPorRol = await Usuario.findAll({
      attributes: [
        'rol',
        [require('sequelize').fn('COUNT', require('sequelize').col('rol')), 'cantidad']
      ],
      group: ['rol'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('rol')), 'DESC']]
    });

    // Usuarios registrados en los últimos 30 días
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const usuariosRecientes = await Usuario.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: treintaDiasAtras
        }
      }
    });

    // Usuarios activos (con cliente o manicure creado)
    const usuariosConCliente = await Usuario.count({
      include: [{
        model: Cliente,
        as: 'cliente',
        required: true
      }]
    });

    const usuariosConManicure = await Usuario.count({
      include: [{
        model: Manicure,
        as: 'manicure',
        required: true
      }]
    });

    res.status(200).json({
      totalUsuarios,
      usuariosRecientes,
      usuariosConCliente,
      usuariosConManicure,
      distribucionPorRol: usuariosPorRol,
      usuariosSinPerfil: totalUsuarios - usuariosConCliente - usuariosConManicure
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las estadísticas de usuarios'
    });
  }
};
