import { Request, Response } from 'express';
import ClienteManicure from '../models/clienteManicure';
import Cliente from '../models/cliente';
import Manicure from '../models/manicure';

// Interface para los tipos de request
interface ClienteManicureRequest extends Request {
  body: {
    manicureidusuario: string;
    clienteidusuario: string;
  };
  params: {
    clienteId?: string;
    manicureId?: string;
  };
  query: {
    clienteId?: string;
    manicureId?: string;
  };
}

// Crear relación cliente-manicure
export const crearRelacionClienteManicure = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { manicureidusuario, clienteidusuario } = req.body;

    // Validar que el cliente exista
    const clienteExistente = await Cliente.findByPk(clienteidusuario);
    if (!clienteExistente) {
      res.status(400).json({
        error: 'Cliente no encontrado',
        mensaje: 'El cliente especificado no existe'
      });
      return;
    }

    // Validar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureidusuario);
    if (!manicureExistente) {
      res.status(400).json({
        error: 'Manicure no encontrada',
        mensaje: 'La manicure especificada no existe'
      });
      return;
    }

    // Verificar si la relación ya existe
    const relacionExistente = await ClienteManicure.findOne({
      where: {
        manicureidusuario,
        clienteidusuario
      }
    });

    if (relacionExistente) {
      res.status(409).json({
        error: 'Relación ya existe',
        mensaje: 'Ya existe una relación entre este cliente y esta manicure'
      });
      return;
    }

    // Crear la relación
    const nuevaRelacion = await ClienteManicure.create({
      manicureidusuario,
      clienteidusuario
    });

    res.status(201).json({
      mensaje: 'Relación cliente-manicure creada exitosamente',
      relacion: nuevaRelacion
    });

  } catch (error) {
    console.error('Error al crear relación cliente-manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear la relación cliente-manicure'
    });
  }
};

// Obtener todas las relaciones cliente-manicure
export const obtenerRelacionesClienteManicure = async (req: Request, res: Response): Promise<void> => {
  try {
    const relaciones = await ClienteManicure.findAll({
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Manicure,
          as: 'manicure',
          attributes: ['nombre', 'telefono']
        }
      ]
    });

    res.status(200).json({
      relaciones,
      total: relaciones.length
    });

  } catch (error) {
    console.error('Error al obtener relaciones cliente-manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las relaciones cliente-manicure'
    });
  }
};

// Obtener relaciones por cliente
export const obtenerRelacionesPorCliente = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params;

    if (!clienteId) {
      res.status(400).json({
        error: 'ID de cliente requerido',
        mensaje: 'Debe proporcionar el ID del cliente'
      });
      return;
    }

    // Verificar que el cliente exista
    const clienteExistente = await Cliente.findByPk(clienteId);
    if (!clienteExistente) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        mensaje: 'No existe un cliente con el ID especificado'
      });
      return;
    }

    const relaciones = await ClienteManicure.findAll({
      where: { clienteidusuario: clienteId },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Manicure,
          as: 'manicure',
          attributes: ['nombre', 'telefono']
        }
      ]
    });

    res.status(200).json({
      clienteId,
      relaciones,
      total: relaciones.length
    });

  } catch (error) {
    console.error('Error al obtener relaciones por cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las relaciones del cliente'
    });
  }
};

// Obtener relaciones por manicure
export const obtenerRelacionesPorManicure = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { manicureId } = req.params;

    if (!manicureId) {
      res.status(400).json({
        error: 'ID de manicure requerido',
        mensaje: 'Debe proporcionar el ID de la manicure'
      });
      return;
    }

    // Verificar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureId);
    if (!manicureExistente) {
      res.status(404).json({
        error: 'Manicure no encontrada',
        mensaje: 'No existe una manicure con el ID especificado'
      });
      return;
    }

    const relaciones = await ClienteManicure.findAll({
      where: { manicureidusuario: manicureId },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Manicure,
          as: 'manicure',
          attributes: ['nombre', 'telefono']
        }
      ]
    });

    res.status(200).json({
      manicureId,
      relaciones,
      total: relaciones.length
    });

  } catch (error) {
    console.error('Error al obtener relaciones por manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las relaciones de la manicure'
    });
  }
};

// Verificar si existe una relación específica
export const verificarRelacionClienteManicure = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { manicureidusuario, clienteidusuario } = req.query;

    if (!manicureidusuario || !clienteidusuario) {
      res.status(400).json({
        error: 'Parámetros requeridos',
        mensaje: 'Debe proporcionar tanto manicureidusuario como clienteidusuario'
      });
      return;
    }

    const relacion = await ClienteManicure.findOne({
      where: {
        manicureidusuario,
        clienteidusuario
      }
    });

    res.status(200).json({
      existe: !!relacion,
      relacion: relacion || null
    });

  } catch (error) {
    console.error('Error al verificar relación cliente-manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo verificar la relación cliente-manicure'
    });
  }
};

// Eliminar relación cliente-manicure
export const eliminarRelacionClienteManicure = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { manicureidusuario, clienteidusuario } = req.body;

    if (!manicureidusuario || !clienteidusuario) {
      res.status(400).json({
        error: 'Parámetros requeridos',
        mensaje: 'Debe proporcionar tanto manicureidusuario como clienteidusuario'
      });
      return;
    }

    const relacion = await ClienteManicure.findOne({
      where: {
        manicureidusuario,
        clienteidusuario
      }
    });

    if (!relacion) {
      res.status(404).json({
        error: 'Relación no encontrada',
        mensaje: 'No existe una relación entre el cliente y la manicure especificados'
      });
      return;
    }

    await relacion.destroy();

    res.status(200).json({
      mensaje: 'Relación cliente-manicure eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar relación cliente-manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar la relación cliente-manicure'
    });
  }
};

// Obtener clientes de una manicure específica
export const obtenerClientesPorManicure = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { manicureId } = req.params;

    if (!manicureId) {
      res.status(400).json({
        error: 'ID de manicure requerido',
        mensaje: 'Debe proporcionar el ID de la manicure'
      });
      return;
    }

    // Verificar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureId);
    if (!manicureExistente) {
      res.status(404).json({
        error: 'Manicure no encontrada',
        mensaje: 'No existe una manicure con el ID especificado'
      });
      return;
    }

    const relaciones = await ClienteManicure.findAll({
      where: { manicureidusuario: manicureId },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['idusuario', 'nombre', 'telefono']
        }
      ]
    });

    const clientes = relaciones.map(relacion => relacion.cliente);

    res.status(200).json({
      manicureId,
      clientes,
      total: clientes.length
    });

  } catch (error) {
    console.error('Error al obtener clientes de manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los clientes de la manicure'
    });
  }
};

// Obtener manicures de un cliente específico
export const obtenerManicuresPorCliente = async (req: ClienteManicureRequest, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params;

    if (!clienteId) {
      res.status(400).json({
        error: 'ID de cliente requerido',
        mensaje: 'Debe proporcionar el ID del cliente'
      });
      return;
    }

    // Verificar que el cliente exista
    const clienteExistente = await Cliente.findByPk(clienteId);
    if (!clienteExistente) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        mensaje: 'No existe un cliente con el ID especificado'
      });
      return;
    }

    const relaciones = await ClienteManicure.findAll({
      where: { clienteidusuario: clienteId },
      include: [
        {
          model: Manicure,
          as: 'manicure',
          attributes: ['idusuario', 'nombre', 'telefono']
        }
      ]
    });

    const manicures = relaciones.map(relacion => relacion.manicure);

    res.status(200).json({
      clienteId,
      manicures,
      total: manicures.length
    });

  } catch (error) {
    console.error('Error al obtener manicures de cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las manicures del cliente'
    });
  }
};
