import { Request, Response } from 'express';
import Manicure from '../models/manicure';
import Usuario from '../models/usuario';

// Interface para los tipos de request
interface ManicureRequest extends Request {
  body: {
    idusuario: string;
    nombre: string;
    foto?: string;
    direccion: string;
    provincia: string;
    municipio: string;
    telefono: string;
  };
  params: {
    id: string;
  };
  query: {
    provincia?: string;
    municipio?: string;
    nombre?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear manicure
export const crearManicure = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { idusuario, nombre, foto, direccion, provincia, municipio, telefono } = req.body;

    // Validar que el usuario exista
    const usuarioExistente = await Usuario.findByPk(idusuario);
    if (!usuarioExistente) {
      res.status(400).json({
        error: 'Usuario no encontrado',
        mensaje: 'El usuario especificado no existe'
      });
      return;
    }

    // Verificar si ya existe una manicure con ese usuario
    const manicureExistente = await Manicure.findByPk(idusuario);
    if (manicureExistente) {
      res.status(409).json({
        error: 'Manicure ya existe',
        mensaje: 'Ya existe una manicure registrada con este usuario'
      });
      return;
    }

    // Validar URL de foto si se proporciona
    if (foto && !esUrlValida(foto)) {
      res.status(400).json({
        error: 'URL de foto inválida',
        mensaje: 'La URL de la foto debe ser válida'
      });
      return;
    }

    // Crear la manicure
    const nuevaManicure = await Manicure.create({
      idusuario,
      nombre,
      foto,
      direccion,
      provincia,
      municipio,
      telefono
    });

    res.status(201).json({
      mensaje: 'Manicure creada exitosamente',
      manicure: nuevaManicure
    });

  } catch (error) {
    console.error('Error al crear manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear la manicure'
    });
  }
};

// Obtener todas las manicures
export const obtenerManicures = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', provincia, municipio, nombre } = req.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    let whereCondition: any = {};
    if (provincia) whereCondition.provincia = provincia;
    if (municipio) whereCondition.municipio = municipio;
    if (nombre) {
      whereCondition.nombre = { [require('sequelize').Op.like]: `%${nombre}%` };
    }

    const manicures = await Manicure.findAll({
      where: whereCondition,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }],
      order: [['nombre', 'ASC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Manicure.count({ where: whereCondition });

    res.status(200).json({
      manicures,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total,
      filtros: {
        provincia,
        municipio,
        nombre
      }
    });

  } catch (error) {
    console.error('Error al obtener manicures:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las manicures'
    });
  }
};

// Obtener manicure por ID
export const obtenerManicurePorId = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const manicure = await Manicure.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }]
    });

    if (!manicure) {
      res.status(404).json({
        error: 'Manicure no encontrada',
        mensaje: 'No existe una manicure con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      manicure
    });

  } catch (error) {
    console.error('Error al obtener manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener la manicure'
    });
  }
};

// Actualizar manicure
export const actualizarManicure = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, foto, direccion, provincia, municipio, telefono } = req.body;

    const manicure = await Manicure.findByPk(id);

    if (!manicure) {
      res.status(404).json({
        error: 'Manicure no encontrada',
        mensaje: 'No existe una manicure con el ID especificado'
      });
      return;
    }

    // Validar URL de foto si se proporciona
    if (foto && !esUrlValida(foto)) {
      res.status(400).json({
        error: 'URL de foto inválida',
        mensaje: 'La URL de la foto debe ser válida'
      });
      return;
    }

    // Actualizar manicure
    await manicure.update({
      nombre: nombre || manicure.nombre,
      foto: foto !== undefined ? foto : manicure.foto,
      direccion: direccion || manicure.direccion,
      provincia: provincia || manicure.provincia,
      municipio: municipio || manicure.municipio,
      telefono: telefono || manicure.telefono
    });

    // Obtener manicure actualizada con relaciones
    const manicureActualizada = await Manicure.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }]
    });

    res.status(200).json({
      mensaje: 'Manicure actualizada exitosamente',
      manicure: manicureActualizada
    });

  } catch (error) {
    console.error('Error al actualizar manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar la manicure'
    });
  }
};

// Eliminar manicure
export const eliminarManicure = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const manicure = await Manicure.findByPk(id);

    if (!manicure) {
      res.status(404).json({
        error: 'Manicure no encontrada',
        mensaje: 'No existe una manicure con el ID especificado'
      });
      return;
    }

    await manicure.destroy();

    res.status(200).json({
      mensaje: 'Manicure eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar la manicure'
    });
  }
};

// Buscar manicures por ubicación
export const buscarManicuresPorUbicacion = async (req: ManicureRequest, res: Response): Promise<void> => {
  try {
    const { provincia, municipio } = req.query;

    if (!provincia && !municipio) {
      res.status(400).json({
        error: 'Parámetros requeridos',
        mensaje: 'Debe proporcionar al menos provincia o municipio para buscar'
      });
      return;
    }

    let whereCondition: any = {};
    if (provincia) whereCondition.provincia = provincia;
    if (municipio) whereCondition.municipio = municipio;

    const manicures = await Manicure.findAll({
      where: whereCondition,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['usuario', 'email']
      }],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      filtros: {
        provincia,
        municipio
      },
      manicures,
      total: manicures.length
    });

  } catch (error) {
    console.error('Error al buscar manicures por ubicación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron buscar las manicures por ubicación'
    });
  }
};

// Obtener estadísticas de manicures
export const obtenerEstadisticasManicures = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalManicures = await Manicure.count();

    // Estadísticas por provincia
    const manicuresPorProvincia = await Manicure.findAll({
      attributes: [
        'provincia',
        [require('sequelize').fn('COUNT', require('sequelize').col('provincia')), 'cantidad']
      ],
      group: ['provincia'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('provincia')), 'DESC']]
    });

    // Estadísticas por municipio
    const manicuresPorMunicipio = await Manicure.findAll({
      attributes: [
        'municipio',
        [require('sequelize').fn('COUNT', require('sequelize').col('municipio')), 'cantidad']
      ],
      group: ['municipio'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('municipio')), 'DESC']],
      limit: 10
    });

    res.status(200).json({
      totalManicures,
      distribucionPorProvincia: manicuresPorProvincia,
      municipiosMasFrecuentes: manicuresPorMunicipio
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de manicures:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener las estadísticas de manicures'
    });
  }
};

// Función auxiliar para validar URLs
function esUrlValida(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
