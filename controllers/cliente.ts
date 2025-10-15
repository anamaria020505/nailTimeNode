import { Request, Response } from 'express';
import Cliente from '../models/cliente';
import Usuario from '../models/usuario';

// Interface para los tipos de request
interface ClienteRequest extends Request {
  body: {
    idusuario: string;
    nombre: string;
    telefono: string;
  };
  params: {
    id: string;
  };
}

// Crear cliente
export const crearCliente = async (req: ClienteRequest, res: Response): Promise<void> => {
  try {
    const { idusuario, nombre, telefono } = req.body;

    // Validar que el usuario exista
    const usuarioExistente = await Usuario.findByPk(idusuario);
    if (!usuarioExistente) {
      res.status(400).json({
        error: 'Usuario no encontrado',
        mensaje: 'El usuario especificado no existe'
      });
      return;
    }

    // Verificar si ya existe un cliente con ese usuario
    const clienteExistente = await Cliente.findByPk(idusuario);
    if (clienteExistente) {
      res.status(409).json({
        error: 'Cliente ya existe',
        mensaje: 'Ya existe un cliente registrado con este usuario'
      });
      return;
    }

    // Crear el cliente
    const nuevoCliente = await Cliente.create({
      idusuario,
      nombre,
      telefono
    });

    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear el cliente'
    });
  }
};

// Obtener todos los clientes
export const obtenerClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientes = await Cliente.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }]
    });

    res.status(200).json({
      clientes,
      total: clientes.length
    });

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los clientes'
    });
  }
};

// Obtener cliente por ID
export const obtenerClientePorId = async (req: ClienteRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }]
    });

    if (!cliente) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        mensaje: 'No existe un cliente con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      cliente
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener el cliente'
    });
  }
};

// Actualizar cliente
export const actualizarCliente = async (req: ClienteRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, telefono } = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        mensaje: 'No existe un cliente con el ID especificado'
      });
      return;
    }

    // Actualizar cliente
    await cliente.update({
      nombre: nombre || cliente.nombre,
      telefono: telefono || cliente.telefono
    });

    res.status(200).json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente
    });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar el cliente'
    });
  }
};

// Eliminar cliente
export const eliminarCliente = async (req: ClienteRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        mensaje: 'No existe un cliente con el ID especificado'
      });
      return;
    }

    await cliente.destroy();

    res.status(200).json({
      mensaje: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar el cliente'
    });
  }
};

// Buscar clientes por nombre o teléfono
export const buscarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Parámetro de búsqueda requerido',
        mensaje: 'Debe proporcionar un término de búsqueda'
      });
      return;
    }

    const clientes = await Cliente.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { nombre: { [require('sequelize').Op.like]: `%${query}%` } },
          { telefono: { [require('sequelize').Op.like]: `%${query}%` } }
        ]
      },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }]
    });

    res.status(200).json({
      clientes,
      total: clientes.length,
      query
    });

  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo realizar la búsqueda'
    });
  }
};
