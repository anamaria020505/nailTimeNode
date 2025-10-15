import { Request, Response } from 'express';
import Horario from '../models/horario';
import Manicure from '../models/manicure';

// Interface para los tipos de request
interface HorarioRequest extends Request {
  body: {
    horaInicio: string;
    horaFinal: string;
    manicureidusuario: string;
  };
  params: {
    id: string;
    manicureId?: string;
  };
  query: {
    manicureId?: string;
    fecha?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear horario
export const crearHorario = async (req: HorarioRequest, res: Response): Promise<void> => {
  try {
    const { horaInicio, horaFinal, manicureidusuario } = req.body;

    // Validar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureidusuario);
    if (!manicureExistente) {
      res.status(400).json({
        error: 'Manicure no encontrada',
        mensaje: 'La manicure especificada no existe'
      });
      return;
    }

    // Validar formato de horas
    if (!esHoraValida(horaInicio) || !esHoraValida(horaFinal)) {
      res.status(400).json({
        error: 'Formato de hora inválido',
        mensaje: 'Las horas deben tener formato HH:MM (24 horas)'
      });
      return;
    }

    // Validar que horaInicio sea anterior a horaFinal
    if (horaInicio >= horaFinal) {
      res.status(400).json({
        error: 'Horario inválido',
        mensaje: 'La hora de inicio debe ser anterior a la hora final'
      });
      return;
    }

    // Verificar si ya existe un horario conflictivo para esta manicure
    const horarioConflicto = await Horario.findOne({
      where: {
        manicureidusuario,
        [require('sequelize').Op.or]: [
          {
            horaInicio: {
              [require('sequelize').Op.between]: [horaInicio, horaFinal]
            }
          },
          {
            horaFinal: {
              [require('sequelize').Op.between]: [horaInicio, horaFinal]
            }
          },
          {
            [require('sequelize').Op.and]: [
              { horaInicio: { [require('sequelize').Op.lte]: horaInicio } },
              { horaFinal: { [require('sequelize').Op.gte]: horaFinal } }
            ]
          }
        ]
      }
    });

    if (horarioConflicto) {
      res.status(409).json({
        error: 'Horario conflictivo',
        mensaje: 'Ya existe un horario que se superpone con el horario especificado'
      });
      return;
    }

    // Crear el horario
    const nuevoHorario = await Horario.create({
      horaInicio,
      horaFinal,
      manicureidusuario
    });

    res.status(201).json({
      mensaje: 'Horario creado exitosamente',
      horario: nuevoHorario
    });

  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear el horario'
    });
  }
};

// Obtener todos los horarios
export const obtenerHorarios = async (req: HorarioRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', manicureId } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition = {};
    if (manicureId) {
      whereCondition = { manicureidusuario: manicureId };
    }

    const horarios = await Horario.findAll({
      where: whereCondition,
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['horaInicio', 'ASC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Horario.count({ where: whereCondition });

    res.status(200).json({
      horarios,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total
    });

  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los horarios'
    });
  }
};

// Obtener horario por ID
export const obtenerHorarioPorId = async (req: HorarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const horario = await Horario.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }]
    });

    if (!horario) {
      res.status(404).json({
        error: 'Horario no encontrado',
        mensaje: 'No existe un horario con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      horario
    });

  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener el horario'
    });
  }
};

// Obtener horarios por manicure
export const obtenerHorariosPorManicure = async (req: HorarioRequest, res: Response): Promise<void> => {
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

    const horarios = await Horario.findAll({
      where: { manicureidusuario: manicureId },
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['horaInicio', 'ASC']]
    });

    res.status(200).json({
      manicureId,
      horarios,
      total: horarios.length
    });

  } catch (error) {
    console.error('Error al obtener horarios por manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los horarios de la manicure'
    });
  }
};

// Actualizar horario
export const actualizarHorario = async (req: HorarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { horaInicio, horaFinal, manicureidusuario } = req.body;

    const horario = await Horario.findByPk(id);

    if (!horario) {
      res.status(404).json({
        error: 'Horario no encontrado',
        mensaje: 'No existe un horario con el ID especificado'
      });
      return;
    }

    // Si se está cambiando la manicure, validar que exista
    if (manicureidusuario && manicureidusuario !== horario.manicureidusuario) {
      const manicureExistente = await Manicure.findByPk(manicureidusuario);
      if (!manicureExistente) {
        res.status(400).json({
          error: 'Manicure no encontrada',
          mensaje: 'La manicure especificada no existe'
        });
        return;
      }
    }

    // Validar formato de horas si se proporcionan
    const nuevaHoraInicio = horaInicio || horario.horaInicio;
    const nuevaHoraFinal = horaFinal || horario.horaFinal;
    const nuevaManicureId = manicureidusuario || horario.manicureidusuario;

    if (!esHoraValida(nuevaHoraInicio) || !esHoraValida(nuevaHoraFinal)) {
      res.status(400).json({
        error: 'Formato de hora inválido',
        mensaje: 'Las horas deben tener formato HH:MM (24 horas)'
      });
      return;
    }

    // Validar que horaInicio sea anterior a horaFinal
    if (nuevaHoraInicio >= nuevaHoraFinal) {
      res.status(400).json({
        error: 'Horario inválido',
        mensaje: 'La hora de inicio debe ser anterior a la hora final'
      });
      return;
    }

    // Verificar conflictos si se están cambiando las horas
    if (horaInicio || horaFinal) {
      const horarioConflicto = await Horario.findOne({
        where: {
          manicureidusuario: nuevaManicureId,
          id: { [require('sequelize').Op.ne]: id }, // Excluir el horario actual
          [require('sequelize').Op.or]: [
            {
              horaInicio: {
                [require('sequelize').Op.between]: [nuevaHoraInicio, nuevaHoraFinal]
              }
            },
            {
              horaFinal: {
                [require('sequelize').Op.between]: [nuevaHoraInicio, nuevaHoraFinal]
              }
            },
            {
              [require('sequelize').Op.and]: [
                { horaInicio: { [require('sequelize').Op.lte]: nuevaHoraInicio } },
                { horaFinal: { [require('sequelize').Op.gte]: nuevaHoraFinal } }
              ]
            }
          ]
        }
      });

      if (horarioConflicto) {
        res.status(409).json({
          error: 'Horario conflictivo',
          mensaje: 'Ya existe un horario que se superpone con el horario especificado'
        });
        return;
      }
    }

    // Actualizar horario
    await horario.update({
      horaInicio: nuevaHoraInicio,
      horaFinal: nuevaHoraFinal,
      manicureidusuario: nuevaManicureId
    });

    // Obtener horario actualizado con relaciones
    const horarioActualizado = await Horario.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }]
    });

    res.status(200).json({
      mensaje: 'Horario actualizado exitosamente',
      horario: horarioActualizado
    });

  } catch (error) {
    console.error('Error al actualizar horario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar el horario'
    });
  }
};

// Eliminar horario
export const eliminarHorario = async (req: HorarioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const horario = await Horario.findByPk(id);

    if (!horario) {
      res.status(404).json({
        error: 'Horario no encontrado',
        mensaje: 'No existe un horario con el ID especificado'
      });
      return;
    }

    await horario.destroy();

    res.status(200).json({
      mensaje: 'Horario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar el horario'
    });
  }
};

// Obtener horarios disponibles para una manicure (útil para agendamiento)
export const obtenerHorariosDisponibles = async (req: HorarioRequest, res: Response): Promise<void> => {
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

    const horarios = await Horario.findAll({
      where: { manicureidusuario: manicureId },
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['horaInicio', 'ASC']]
    });

    res.status(200).json({
      manicureId,
      horarios: horarios.map(h => ({
        id: h.id,
        horaInicio: h.horaInicio,
        horaFinal: h.horaFinal,
        duracion: calcularDuracion(h.horaInicio, h.horaFinal)
      })),
      total: horarios.length
    });

  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los horarios disponibles'
    });
  }
};

// Función auxiliar para validar formato de hora (HH:MM)
function esHoraValida(hora: string): boolean {
  const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return horaRegex.test(hora);
}

// Función auxiliar para calcular duración en minutos
function calcularDuracion(horaInicio: string, horaFinal: string): number {
  const inicio = new Date(`1970-01-01T${horaInicio}:00`);
  const fin = new Date(`1970-01-01T${horaFinal}:00`);
  return (fin.getTime() - inicio.getTime()) / (1000 * 60);
}
