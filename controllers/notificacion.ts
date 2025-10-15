import { Request, Response } from 'express';
import Notificacion from '../models/notificacion';
import Cliente from '../models/cliente';
import Manicure from '../models/manicure';
import Reservacion from '../models/reservacion';

// Interface para los tipos de request
interface NotificacionRequest extends Request {
  body: {
    mensaje: string;
    reservacionid: number;
    manicureidusuario: string;
    clienteidusuario: string;
  };
  params: {
    id: string;
    clienteId?: string;
    manicureId?: string;
  };
  query: {
    clienteId?: string;
    manicureId?: string;
    leido?: string;
    reservacionId?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear notificación
export const crearNotificacion = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { mensaje, reservacionid, manicureidusuario, clienteidusuario } = req.body;

    // Validar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureidusuario);
    if (!manicureExistente) {
      res.status(400).json({
        error: 'Manicure no encontrada',
        mensaje: 'La manicure especificada no existe'
      });
      return;
    }

    // Validar que el cliente exista
    const clienteExistente = await Cliente.findByPk(clienteidusuario);
    if (!clienteExistente) {
      res.status(400).json({
        error: 'Cliente no encontrado',
        mensaje: 'El cliente especificado no existe'
      });
      return;
    }

    // Validar que la reservación exista
    const reservacionExistente = await Reservacion.findByPk(reservacionid);
    if (!reservacionExistente) {
      res.status(400).json({
        error: 'Reservación no encontrada',
        mensaje: 'La reservación especificada no existe'
      });
      return;
    }

    // Crear la notificación
    const nuevaNotificacion = await Notificacion.create({
      mensaje,
      reservacionid,
      manicureidusuario,
      clienteidusuario
    });

    res.status(201).json({
      mensaje: 'Notificación creada exitosamente',
      notificacion: nuevaNotificacion
    });

  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear la notificación'
    });
  }
};

// Obtener todas las notificaciones
export const obtenerNotificaciones = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', clienteId, manicureId, leido, reservacionId } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition: any = {};
    if (clienteId) whereCondition.clienteidusuario = clienteId;
    if (manicureId) whereCondition.manicureidusuario = manicureId;
    if (reservacionId) whereCondition.reservacionid = reservacionId;
    if (leido !== undefined) whereCondition.leido = leido === 'true';

    const notificaciones = await Notificacion.findAll({
      where: whereCondition,
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
        },
        {
          model: Reservacion,
          as: 'reservacion',
          attributes: ['fecha', 'hora']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Notificacion.count({ where: whereCondition });

    res.status(200).json({
      notificaciones,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total,
      filtros: {
        clienteId,
        manicureId,
        leido,
        reservacionId
      }
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las notificaciones'
    });
  }
};

// Obtener notificación por ID
export const obtenerNotificacionPorId = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id, {
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
        },
        {
          model: Reservacion,
          as: 'reservacion',
          attributes: ['fecha', 'hora']
        }
      ]
    });

    if (!notificacion) {
      res.status(404).json({
        error: 'Notificación no encontrada',
        mensaje: 'No existe una notificación con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      notificacion
    });

  } catch (error) {
    console.error('Error al obtener notificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener la notificación'
    });
  }
};

// Obtener notificaciones por cliente
export const obtenerNotificacionesPorCliente = async (req: NotificacionRequest, res: Response): Promise<void> => {
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

    const { leido } = req.query;
    let whereCondition: any = { clienteidusuario: clienteId };
    if (leido !== undefined) {
      whereCondition.leido = leido === 'true';
    }

    const notificaciones = await Notificacion.findAll({
      where: whereCondition,
      include: [
        {
          model: Manicure,
          as: 'manicure',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Reservacion,
          as: 'reservacion',
          attributes: ['fecha', 'hora']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Marcar como leídas las notificaciones no leídas al consultarlas
    const notificacionesNoLeidas = notificaciones.filter(n => !n.leido);
    if (notificacionesNoLeidas.length > 0) {
      await Promise.all(
        notificacionesNoLeidas.map(n => n.update({ leido: true }))
      );
    }

    res.status(200).json({
      clienteId,
      notificaciones,
      total: notificaciones.length,
      marcadasComoLeidas: notificacionesNoLeidas.length
    });

  } catch (error) {
    console.error('Error al obtener notificaciones por cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las notificaciones del cliente'
    });
  }
};

// Obtener notificaciones enviadas por manicure
export const obtenerNotificacionesPorManicure = async (req: NotificacionRequest, res: Response): Promise<void> => {
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

    const notificaciones = await Notificacion.findAll({
      where: { manicureidusuario: manicureId },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Reservacion,
          as: 'reservacion',
          attributes: ['fecha', 'hora']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      manicureId,
      notificaciones,
      total: notificaciones.length
    });

  } catch (error) {
    console.error('Error al obtener notificaciones por manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las notificaciones de la manicure'
    });
  }
};

// Marcar notificación como leída
export const marcarNotificacionComoLeida = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) {
      res.status(404).json({
        error: 'Notificación no encontrada',
        mensaje: 'No existe una notificación con el ID especificado'
      });
      return;
    }

    if (notificacion.leido) {
      res.status(200).json({
        mensaje: 'La notificación ya estaba marcada como leída',
        notificacion
      });
      return;
    }

    await notificacion.update({ leido: true });

    res.status(200).json({
      mensaje: 'Notificación marcada como leída exitosamente',
      notificacion
    });

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo marcar la notificación como leída'
    });
  }
};

// Marcar múltiples notificaciones como leídas
export const marcarNotificacionesComoLeidas = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.body;

    if (!clienteId) {
      res.status(400).json({
        error: 'ID de cliente requerido',
        mensaje: 'Debe proporcionar el ID del cliente'
      });
      return;
    }

    const notificacionesNoLeidas = await Notificacion.findAll({
      where: {
        clienteidusuario: clienteId,
        leido: false
      }
    });

    if (notificacionesNoLeidas.length === 0) {
      res.status(200).json({
        mensaje: 'No hay notificaciones no leídas para este cliente',
        marcadasComoLeidas: 0
      });
      return;
    }

    await Promise.all(
      notificacionesNoLeidas.map(n => n.update({ leido: true }))
    );

    res.status(200).json({
      mensaje: `${notificacionesNoLeidas.length} notificaciones marcadas como leídas exitosamente`,
      marcadasComoLeidas: notificacionesNoLeidas.length
    });

  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron marcar las notificaciones como leídas'
    });
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (req: NotificacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) {
      res.status(404).json({
        error: 'Notificación no encontrada',
        mensaje: 'No existe una notificación con el ID especificado'
      });
      return;
    }

    await notificacion.destroy();

    res.status(200).json({
      mensaje: 'Notificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar la notificación'
    });
  }
};

// Obtener estadísticas de notificaciones
export const obtenerEstadisticasNotificaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalNotificaciones = await Notificacion.count();
    const notificacionesLeidas = await Notificacion.count({ where: { leido: true } });
    const notificacionesNoLeidas = await Notificacion.count({ where: { leido: false } });

    // Notificaciones por manicure (top 10)
    const notificacionesPorManicure = await Notificacion.findAll({
      attributes: [
        'manicureidusuario',
        [require('sequelize').fn('COUNT', require('sequelize').col('manicureidusuario')), 'cantidad']
      ],
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre']
      }],
      group: ['manicureidusuario', 'manicure.nombre'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('manicureidusuario')), 'DESC']],
      limit: 10
    });

    res.status(200).json({
      totalNotificaciones,
      notificacionesLeidas,
      notificacionesNoLeidas,
      porcentajeLeidas: totalNotificaciones > 0 ? ((notificacionesLeidas / totalNotificaciones) * 100).toFixed(2) : 0,
      manicuresMasActivas: notificacionesPorManicure
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de notificaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las estadísticas de notificaciones'
    });
  }
};
