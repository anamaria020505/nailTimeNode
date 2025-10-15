import { Request, Response } from 'express';
import Servicio from '../models/servicio';
import Manicure from '../models/manicure';

// Interface para los tipos de request
interface ServicioRequest extends Request {
  body: {
    nombre: string;
    disponible?: boolean;
    manicureidusuario: string;
  };
  params: {
    id: string;
    manicureId?: string;
  };
  query: {
    manicureId?: string;
    disponible?: string;
    nombre?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear servicio
export const crearServicio = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { nombre, disponible = true, manicureidusuario } = req.body;

    // Validar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureidusuario);
    if (!manicureExistente) {
      res.status(400).json({
        error: 'Manicure no encontrada',
        mensaje: 'La manicure especificada no existe'
      });
      return;
    }

    // Verificar si ya existe un servicio con ese nombre para esta manicure
    const servicioExistente = await Servicio.findOne({
      where: {
        nombre,
        manicureidusuario
      }
    });

    if (servicioExistente) {
      res.status(409).json({
        error: 'Servicio ya existe',
        mensaje: 'Ya existe un servicio con ese nombre para esta manicure'
      });
      return;
    }

    // Crear el servicio
    const nuevoServicio = await Servicio.create({
      nombre,
      disponible,
      manicureidusuario
    });

    res.status(201).json({
      mensaje: 'Servicio creado exitosamente',
      servicio: nuevoServicio
    });

  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear el servicio'
    });
  }
};

// Obtener todos los servicios
export const obtenerServicios = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', manicureId, disponible, nombre } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition: any = {};
    if (manicureId) whereCondition.manicureidusuario = manicureId;
    if (disponible !== undefined) whereCondition.disponible = disponible === 'true';
    if (nombre) {
      whereCondition.nombre = { [require('sequelize').Op.like]: `%${nombre}%` };
    }

    const servicios = await Servicio.findAll({
      where: whereCondition,
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono', 'provincia', 'municipio']
      }],
      order: [['nombre', 'ASC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Servicio.count({ where: whereCondition });

    res.status(200).json({
      servicios,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total,
      filtros: {
        manicureId,
        disponible,
        nombre
      }
    });

  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los servicios'
    });
  }
};

// Obtener servicio por ID
export const obtenerServicioPorId = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono', 'provincia', 'municipio']
      }]
    });

    if (!servicio) {
      res.status(404).json({
        error: 'Servicio no encontrado',
        mensaje: 'No existe un servicio con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      servicio
    });

  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener el servicio'
    });
  }
};

// Obtener servicios por manicure
export const obtenerServiciosPorManicure = async (req: ServicioRequest, res: Response): Promise<void> => {
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

    const { disponible } = req.query;
    let whereCondition: any = { manicureidusuario: manicureId };
    if (disponible !== undefined) {
      whereCondition.disponible = disponible === 'true';
    }

    const servicios = await Servicio.findAll({
      where: whereCondition,
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono', 'provincia', 'municipio']
      }],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      manicureId,
      servicios,
      total: servicios.length,
      disponibles: servicios.filter(s => s.disponible).length
    });

  } catch (error) {
    console.error('Error al obtener servicios por manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los servicios de la manicure'
    });
  }
};

// Actualizar servicio
export const actualizarServicio = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, disponible, manicureidusuario } = req.body;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      res.status(404).json({
        error: 'Servicio no encontrado',
        mensaje: 'No existe un servicio con el ID especificado'
      });
      return;
    }

    // Si se está cambiando la manicure, validar que exista
    if (manicureidusuario && manicureidusuario !== servicio.manicureidusuario) {
      const manicureExistente = await Manicure.findByPk(manicureidusuario);
      if (!manicureExistente) {
        res.status(400).json({
          error: 'Manicure no encontrada',
          mensaje: 'La manicure especificada no existe'
        });
        return;
      }
    }

    // Si se está cambiando el nombre, verificar que no exista duplicado
    if (nombre && nombre !== servicio.nombre) {
      const servicioExistente = await Servicio.findOne({
        where: {
          nombre,
          manicureidusuario: manicureidusuario || servicio.manicureidusuario
        }
      });

      if (servicioExistente) {
        res.status(409).json({
          error: 'Servicio ya existe',
          mensaje: 'Ya existe un servicio con ese nombre para esta manicure'
        });
        return;
      }
    }

    // Actualizar servicio
    await servicio.update({
      nombre: nombre || servicio.nombre,
      disponible: disponible !== undefined ? disponible : servicio.disponible,
      manicureidusuario: manicureidusuario || servicio.manicureidusuario
    });

    // Obtener servicio actualizado con relaciones
    const servicioActualizado = await Servicio.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono', 'provincia', 'municipio']
      }]
    });

    res.status(200).json({
      mensaje: 'Servicio actualizado exitosamente',
      servicio: servicioActualizado
    });

  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar el servicio'
    });
  }
};

// Eliminar servicio
export const eliminarServicio = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      res.status(404).json({
        error: 'Servicio no encontrado',
        mensaje: 'No existe un servicio con el ID especificado'
      });
      return;
    }

    await servicio.destroy();

    res.status(200).json({
      mensaje: 'Servicio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar el servicio'
    });
  }
};

// Cambiar disponibilidad de servicio
export const cambiarDisponibilidadServicio = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      res.status(400).json({
        error: 'Valor inválido',
        mensaje: 'El campo disponible debe ser true o false'
      });
      return;
    }

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      res.status(404).json({
        error: 'Servicio no encontrado',
        mensaje: 'No existe un servicio con el ID especificado'
      });
      return;
    }

    await servicio.update({ disponible });

    res.status(200).json({
      mensaje: `Servicio ${disponible ? 'habilitado' : 'deshabilitado'} exitosamente`,
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        disponible: servicio.disponible
      }
    });

  } catch (error) {
    console.error('Error al cambiar disponibilidad del servicio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo cambiar la disponibilidad del servicio'
    });
  }
};

// Obtener servicios disponibles
export const obtenerServiciosDisponibles = async (req: ServicioRequest, res: Response): Promise<void> => {
  try {
    const { manicureId } = req.query;

    let whereCondition: any = { disponible: true };
    if (manicureId) whereCondition.manicureidusuario = manicureId;

    const servicios = await Servicio.findAll({
      where: whereCondition,
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono', 'provincia', 'municipio']
      }],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      servicios,
      total: servicios.length,
      filtros: {
        disponible: true,
        manicureId
      }
    });

  } catch (error) {
    console.error('Error al obtener servicios disponibles:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los servicios disponibles'
    });
  }
};

// Obtener estadísticas de servicios
export const obtenerEstadisticasServicios = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalServicios = await Servicio.count();
    const serviciosDisponibles = await Servicio.count({ where: { disponible: true } });
    const serviciosNoDisponibles = await Servicio.count({ where: { disponible: false } });

    // Servicios más comunes
    const serviciosPorNombre = await Servicio.findAll({
      attributes: [
        'nombre',
        [require('sequelize').fn('COUNT', require('sequelize').col('nombre')), 'cantidad']
      ],
      group: ['nombre'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('nombre')), 'DESC']],
      limit: 10
    });

    res.status(200).json({
      totalServicios,
      serviciosDisponibles,
      serviciosNoDisponibles,
      serviciosMasComunes: serviciosPorNombre,
      porcentajeDisponibles: totalServicios > 0 ? ((serviciosDisponibles / totalServicios) * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de servicios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las estadísticas de servicios'
    });
  }
};
