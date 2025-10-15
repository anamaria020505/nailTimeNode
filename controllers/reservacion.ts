import { Request, Response } from 'express';
import Reservacion from '../models/reservacion';
import Cliente from '../models/cliente';
import Manicure from '../models/manicure';
import Servicio from '../models/servicio';
import Horario from '../models/horario';
import Notificacion from '../models/notificacion';

// Interface para los tipos de request
interface ReservacionRequest extends Request {
  body: {
    disenno?: string;
    tamanno?: string;
    precio: number;
    fecha: string;
    estado?: string;
    horarioid: number;
    clienteidusuario: string;
    servicioid: number;
  };
  params: {
    id: string;
    clienteId?: string;
    manicureId?: string;
  };
  query: {
    clienteId?: string;
    manicureId?: string;
    estado?: string;
    fecha?: string;
    servicioId?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear reservación
export const crearReservacion = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { disenno, tamanno, precio, fecha, estado = 'pendiente', horarioid, clienteidusuario, servicioid } = req.body;

    // Validar que el cliente exista
    const clienteExistente = await Cliente.findByPk(clienteidusuario);
    if (!clienteExistente) {
      res.status(400).json({
        error: 'Cliente no encontrado',
        mensaje: 'El cliente especificado no existe'
      });
      return;
    }

    // Validar que el servicio exista
    const servicioExistente = await Servicio.findByPk(servicioid);
    if (!servicioExistente) {
      res.status(400).json({
        error: 'Servicio no encontrado',
        mensaje: 'El servicio especificado no existe'
      });
      return;
    }

    // Validar que el horario exista
    const horarioExistente = await Horario.findByPk(horarioid);
    if (!horarioExistente) {
      res.status(400).json({
        error: 'Horario no encontrado',
        mensaje: 'El horario especificado no existe'
      });
      return;
    }

    // Validar que la fecha tenga formato correcto (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      res.status(400).json({
        error: 'Formato de fecha inválido',
        mensaje: 'La fecha debe tener formato YYYY-MM-DD'
      });
      return;
    }

    // Verificar que no exista una reservación conflictiva para este horario y fecha
    const reservacionConflicto = await Reservacion.findOne({
      where: {
        horarioid,
        fecha: new Date(fecha)
      }
    });

    if (reservacionConflicto) {
      res.status(409).json({
        error: 'Horario ocupado',
        mensaje: 'Ya existe una reservación para este horario en la fecha especificada'
      });
      return;
    }

    // Crear la reservación
    const nuevaReservacion = await Reservacion.create({
      disenno,
      tamanno,
      precio,
      fecha: new Date(fecha),
      estado,
      horarioid,
      clienteidusuario,
      servicioid
    });

    // Crear notificación automática para la manicure
    try {
      await Notificacion.create({
        mensaje: `Nueva reservación creada para el ${fecha}`,
        reservacionid: nuevaReservacion.id,
        manicureidusuario: servicioExistente.manicureidusuario,
        clienteidusuario
      });
    } catch (notificacionError) {
      console.error('Error al crear notificación automática:', notificacionError);
    }

    // Obtener reservación completa con relaciones
    const reservacionCompleta = await Reservacion.findByPk(nuevaReservacion.id, {
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Servicio,
          as: 'servicio',
          attributes: ['nombre']
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['horaInicio', 'horaFinal']
        }
      ]
    });

    res.status(201).json({
      mensaje: 'Reservación creada exitosamente',
      reservacion: reservacionCompleta
    });

  } catch (error) {
    console.error('Error al crear reservación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear la reservación'
    });
  }
};

// Obtener todas las reservaciones
export const obtenerReservaciones = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', clienteId, manicureId, estado, fecha, servicioId } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition: any = {};
    if (clienteId) whereCondition.clienteidusuario = clienteId;
    if (manicureId) {
      // Si se filtra por manicure, necesitamos hacer join con servicio para obtener manicureidusuario
      const serviciosManicure = await Servicio.findAll({
        where: { manicureidusuario: manicureId },
        attributes: ['id']
      });
      const servicioIds = serviciosManicure.map(s => s.id);
      if (servicioIds.length > 0) {
        whereCondition.servicioid = servicioIds;
      } else {
        // Si la manicure no tiene servicios, retornar array vacío
        res.status(200).json({
          reservaciones: [],
          total: 0,
          filtros: { manicureId, clienteId, estado, fecha, servicioId }
        });
        return;
      }
    }
    if (estado) whereCondition.estado = estado;
    if (fecha) whereCondition.fecha = new Date(fecha);
    if (servicioId) whereCondition.servicioid = servicioId;

    const reservaciones = await Reservacion.findAll({
      where: whereCondition,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Servicio,
          as: 'servicio',
          include: [{
            model: Manicure,
            as: 'manicure',
            attributes: ['nombre', 'telefono']
          }]
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['horaInicio', 'horaFinal']
        }
      ],
      order: [['fecha', 'ASC'], ['horario', 'horaInicio', 'ASC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Reservacion.count({ where: whereCondition });

    res.status(200).json({
      reservaciones,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total,
      filtros: {
        clienteId,
        manicureId,
        estado,
        fecha,
        servicioId
      }
    });

  } catch (error) {
    console.error('Error al obtener reservaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las reservaciones'
    });
  }
};

// Obtener reservación por ID
export const obtenerReservacionPorId = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reservacion = await Reservacion.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Servicio,
          as: 'servicio',
          include: [{
            model: Manicure,
            as: 'manicure',
            attributes: ['nombre', 'telefono']
          }]
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['horaInicio', 'horaFinal']
        }
      ]
    });

    if (!reservacion) {
      res.status(404).json({
        error: 'Reservación no encontrada',
        mensaje: 'No existe una reservación con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      reservacion
    });

  } catch (error) {
    console.error('Error al obtener reservación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener la reservación'
    });
  }
};

// Obtener reservaciones por cliente
export const obtenerReservacionesPorCliente = async (req: ReservacionRequest, res: Response): Promise<void> => {
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

    const { estado, fecha } = req.query;
    let whereCondition: any = { clienteidusuario: clienteId };
    if (estado) whereCondition.estado = estado;
    if (fecha) whereCondition.fecha = new Date(fecha);

    const reservaciones = await Reservacion.findAll({
      where: whereCondition,
      include: [
        {
          model: Servicio,
          as: 'servicio',
          include: [{
            model: Manicure,
            as: 'manicure',
            attributes: ['nombre', 'telefono']
          }]
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['horaInicio', 'horaFinal']
        }
      ],
      order: [['fecha', 'ASC'], ['horario', 'horaInicio', 'ASC']]
    });

    res.status(200).json({
      clienteId,
      reservaciones,
      total: reservaciones.length
    });

  } catch (error) {
    console.error('Error al obtener reservaciones por cliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las reservaciones del cliente'
    });
  }
};

// Actualizar reservación
export const actualizarReservacion = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { disenno, tamanno, precio, fecha, estado, horarioid, clienteidusuario, servicioid } = req.body;

    const reservacion = await Reservacion.findByPk(id);

    if (!reservacion) {
      res.status(404).json({
        error: 'Reservación no encontrada',
        mensaje: 'No existe una reservación con el ID especificado'
      });
      return;
    }

    // Validar entidades si se están cambiando
    if (servicioid && servicioid !== reservacion.servicioid) {
      const servicioExistente = await Servicio.findByPk(servicioid);
      if (!servicioExistente) {
        res.status(400).json({
          error: 'Servicio no encontrado',
          mensaje: 'El servicio especificado no existe'
        });
        return;
      }
    }

    if (horarioid && horarioid !== reservacion.horarioid) {
      const horarioExistente = await Horario.findByPk(horarioid);
      if (!horarioExistente) {
        res.status(400).json({
          error: 'Horario no encontrado',
          mensaje: 'El horario especificado no existe'
        });
        return;
      }

      // Verificar conflictos si se cambia el horario
      const reservacionConflicto = await Reservacion.findOne({
        where: {
          horarioid,
          fecha: fecha ? new Date(fecha) : reservacion.fecha,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (reservacionConflicto) {
        res.status(409).json({
          error: 'Horario ocupado',
          mensaje: 'Ya existe una reservación para este horario en la fecha especificada'
        });
        return;
      }
    }

    // Validar formato de fecha si se proporciona
    if (fecha) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        res.status(400).json({
          error: 'Formato de fecha inválido',
          mensaje: 'La fecha debe tener formato YYYY-MM-DD'
        });
        return;
      }
    }

    // Actualizar reservación
    await reservacion.update({
      disenno: disenno !== undefined ? disenno : reservacion.disenno,
      tamanno: tamanno !== undefined ? tamanno : reservacion.tamanno,
      precio: precio || reservacion.precio,
      fecha: fecha ? new Date(fecha) : reservacion.fecha,
      estado: estado || reservacion.estado,
      horarioid: horarioid || reservacion.horarioid,
      clienteidusuario: clienteidusuario || reservacion.clienteidusuario,
      servicioid: servicioid || reservacion.servicioid
    });

    // Obtener reservación actualizada con relaciones
    const reservacionActualizada = await Reservacion.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['nombre', 'telefono']
        },
        {
          model: Servicio,
          as: 'servicio',
          include: [{
            model: Manicure,
            as: 'manicure',
            attributes: ['nombre', 'telefono']
          }]
        },
        {
          model: Horario,
          as: 'horario',
          attributes: ['horaInicio', 'horaFinal']
        }
      ]
    });

    res.status(200).json({
      mensaje: 'Reservación actualizada exitosamente',
      reservacion: reservacionActualizada
    });

  } catch (error) {
    console.error('Error al actualizar reservación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar la reservación'
    });
  }
};

// Cancelar reservación
export const cancelarReservacion = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reservacion = await Reservacion.findByPk(id);

    if (!reservacion) {
      res.status(404).json({
        error: 'Reservación no encontrada',
        mensaje: 'No existe una reservación con el ID especificado'
      });
      return;
    }

    // Verificar que la reservación no esté ya completada o cancelada
    if (reservacion.estado === 'completada') {
      res.status(400).json({
        error: 'Reservación completada',
        mensaje: 'No se puede cancelar una reservación que ya está completada'
      });
      return;
    }

    if (reservacion.estado === 'cancelada') {
      res.status(400).json({
        error: 'Reservación ya cancelada',
        mensaje: 'La reservación ya está cancelada'
      });
      return;
    }

    await reservacion.update({ estado: 'cancelada' });

    res.status(200).json({
      mensaje: 'Reservación cancelada exitosamente',
      reservacion: {
        id: reservacion.id,
        estado: reservacion.estado,
        fecha: reservacion.fecha
      }
    });

  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo cancelar la reservación'
    });
  }
};

// Completar reservación
export const completarReservacion = async (req: ReservacionRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reservacion = await Reservacion.findByPk(id);

    if (!reservacion) {
      res.status(404).json({
        error: 'Reservación no encontrada',
        mensaje: 'No existe una reservación con el ID especificado'
      });
      return;
    }

    // Verificar que la reservación esté confirmada
    if (reservacion.estado !== 'confirmada') {
      res.status(400).json({
        error: 'Estado inválido',
        mensaje: 'Solo se pueden completar reservaciones que estén confirmadas'
      });
      return;
    }

    await reservacion.update({ estado: 'completada' });

    res.status(200).json({
      mensaje: 'Reservación completada exitosamente',
      reservacion: {
        id: reservacion.id,
        estado: reservacion.estado,
        fecha: reservacion.fecha
      }
    });

  } catch (error) {
    console.error('Error al completar reservación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo completar la reservación'
    });
  }
};

// Obtener estadísticas de reservaciones
export const obtenerEstadisticasReservaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalReservaciones = await Reservacion.count();

    const reservacionesPorEstado = await Reservacion.findAll({
      attributes: [
        'estado',
        [require('sequelize').fn('COUNT', require('sequelize').col('estado')), 'cantidad']
      ],
      group: ['estado'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('estado')), 'DESC']]
    });

    // Reservaciones por mes (últimos 12 meses)
    const reservacionesPorMes = await Reservacion.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha'), '%Y-%m'), 'mes'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha'), '%Y-%m')],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha'), '%Y-%m'), 'DESC']],
      limit: 12
    });

    // Ingresos totales (suma de precios)
    const ingresosTotales = await Reservacion.sum('precio');

    res.status(200).json({
      totalReservaciones,
      ingresosTotales: ingresosTotales || 0,
      distribucionPorEstado: reservacionesPorEstado,
      tendenciaMensual: reservacionesPorMes
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de reservaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las estadísticas de reservaciones'
    });
  }
};
