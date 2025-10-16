import { Request, Response } from 'express';
import Disenno from '../models/disenno';
import Manicure from '../models/manicure';

// Interface para los tipos de request
interface DisennoRequest extends Request {
  body: {
    url: string;
    manicureidusuario: string;
  };
  params: {
    id: string;
    manicureId?: string;
  };
  query: {
    manicureId?: string;
    limit?: string;
    offset?: string;
  };
}

// Crear diseño
export const crearDisenno = async (req: DisennoRequest, res: Response): Promise<void> => {
  try {
    const { url, manicureidusuario } = req.body;

    // Validar que la manicure exista
    const manicureExistente = await Manicure.findByPk(manicureidusuario);
    if (!manicureExistente) {
      res.status(400).json({
        error: 'Manicure no encontrada',
        mensaje: 'La manicure especificada no existe'
      });
      return;
    }

    // Validar URL
    if (!url || !esUrlValida(url)) {
      res.status(400).json({
        error: 'URL inválida',
        mensaje: 'Debe proporcionar una URL válida para la imagen del diseño'
      });
      return;
    }

    // Crear el diseño
    const nuevoDisenno = await Disenno.create({
      url,
      manicureidusuario
    });

    res.status(201).json({
      mensaje: 'Diseño creado exitosamente',
      disenno: nuevoDisenno
    });

  } catch (error) {
    console.error('Error al crear diseño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo crear el diseño'
    });
  }
};

// Obtener todos los diseños
export const obtenerDisennos = async (req: DisennoRequest, res: Response): Promise<void> => {
  try {
    const { limit, offset, manicureId } = req.query;

    const limitNum = parseInt(typeof limit === 'string' ? limit : '50', 10);
    const offsetNum = parseInt(typeof offset === 'string' ? offset : '0', 10);

    let whereCondition = {};
    if (manicureId) {
      whereCondition = { manicureidusuario: manicureId };
    }

    const disennos = await Disenno.findAll({
      where: whereCondition,
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Disenno.count({ where: whereCondition });

    res.status(200).json({
      disennos,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total
    });

  } catch (error) {
    console.error('Error al obtener diseños:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los diseños'
    });
  }
};

// Obtener diseño por ID
export const obtenerDisennoPorId = async (req: DisennoRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const disenno = await Disenno.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }]
    });

    if (!disenno) {
      res.status(404).json({
        error: 'Diseño no encontrado',
        mensaje: 'No existe un diseño con el ID especificado'
      });
      return;
    }

    res.status(200).json({
      disenno
    });

  } catch (error) {
    console.error('Error al obtener diseño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo obtener el diseño'
    });
  }
};

// Obtener diseños por manicure
export const obtenerDisennosPorManicure = async (req: DisennoRequest, res: Response): Promise<void> => {
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

    const { limit, offset } = req.query;
    const limitNum = parseInt(typeof limit === 'string' ? limit : '20', 10);
    const offsetNum = parseInt(typeof offset === 'string' ? offset : '0', 10);

    const disennos = await Disenno.findAll({
      where: { manicureidusuario: manicureId },
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offsetNum
    });

    const total = await Disenno.count({ where: { manicureidusuario: manicureId } });

    res.status(200).json({
      manicureId,
      disennos,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (offsetNum + limitNum) < total
    });

  } catch (error) {
    console.error('Error al obtener diseños por manicure:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los diseños de la manicure'
    });
  }
};

// Actualizar diseño
export const actualizarDisenno = async (req: DisennoRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { url, manicureidusuario } = req.body;

    const disenno = await Disenno.findByPk(id);

    if (!disenno) {
      res.status(404).json({
        error: 'Diseño no encontrado',
        mensaje: 'No existe un diseño con el ID especificado'
      });
      return;
    }

    // Si se está cambiando la manicure, validar que exista
    if (manicureidusuario && manicureidusuario !== disenno.manicureidusuario) {
      const manicureExistente = await Manicure.findByPk(manicureidusuario);
      if (!manicureExistente) {
        res.status(400).json({
          error: 'Manicure no encontrada',
          mensaje: 'La manicure especificada no existe'
        });
        return;
      }
    }

    // Validar URL si se proporciona
    if (url && !esUrlValida(url)) {
      res.status(400).json({
        error: 'URL inválida',
        mensaje: 'Debe proporcionar una URL válida para la imagen del diseño'
      });
      return;
    }

    // Actualizar diseño
    await disenno.update({
      url: url || disenno.url,
      manicureidusuario: manicureidusuario || disenno.manicureidusuario
    });

    // Obtener diseño actualizado con relaciones
    const disennoActualizado = await Disenno.findByPk(id, {
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }]
    });

    res.status(200).json({
      mensaje: 'Diseño actualizado exitosamente',
      disenno: disennoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar diseño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo actualizar el diseño'
    });
  }
};

// Eliminar diseño
export const eliminarDisenno = async (req: DisennoRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const disenno = await Disenno.findByPk(id);

    if (!disenno) {
      res.status(404).json({
        error: 'Diseño no encontrado',
        mensaje: 'No existe un diseño con el ID especificado'
      });
      return;
    }

    await disenno.destroy();

    res.status(200).json({
      mensaje: 'Diseño eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar diseño:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo eliminar el diseño'
    });
  }
};

// Buscar diseños recientes (últimos N diseños)
export const obtenerDisennosRecientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(typeof limit === 'string' ? limit : '10', 10);

    const disennos = await Disenno.findAll({
      include: [{
        model: Manicure,
        as: 'manicure',
        attributes: ['nombre', 'telefono']
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum
    });

    res.status(200).json({
      disennos,
      total: disennos.length
    });

  } catch (error) {
    console.error('Error al obtener diseños recientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudieron obtener los diseños recientes'
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
