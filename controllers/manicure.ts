import { Request as ExpressRequest, Response } from "express";
import Manicure from "../models/manicure";
import Usuario from "../models/usuario";
import { Op, fn, col, literal } from "sequelize";
import Reservacion from "../models/reservacion";

interface MunicipioStats {
  municipio: string;
  total: number | string; // Sequelize might return string for COUNT
  [key: string]: any; // Para otras propiedades que puedan venir en el resultado
}

// Extender la interfaz Request para incluir la propiedad user
declare global {
  namespace Express {
    interface Request {
      userData?: {
        usuario: string;
      };
    }
  }
}

/**
 * Obtiene la cantidad de manicuristas agrupados por provincia y municipio
 * @returns Promesa con las estadísticas de ubicación de los manicuristas
 */
export const obtenerEstadisticasPorUbicacion = async () => {
  // Obtener todos los manicuristas con sus datos de ubicación
  const manicuristas = await Manicure.findAll({
    attributes: ['provincia', 'municipio', 'idusuario'],
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre'],
      }
    ]
  });

  // Procesar los datos para agrupar por provincia y municipio
  const estadisticas: Record<string, {
    provincia: string;
    municipios: Record<string, number>;
    total: number;
  }> = {};

  manicuristas.forEach(manicurista => {
    const { provincia, municipio } = manicurista;
    
    if (!estadisticas[provincia]) {
      estadisticas[provincia] = {
        provincia,
        municipios: {},
        total: 0
      };
    }
    
    if (!estadisticas[provincia].municipios[municipio]) {
      estadisticas[provincia].municipios[municipio] = 0;
    }
    
    estadisticas[provincia].municipios[municipio]++;
    estadisticas[provincia].total++;
  });

  // Convertir el objeto a un array para la respuesta
  return Object.values(estadisticas).map(provincia => ({
    ...provincia,
    municipios: Object.entries(provincia.municipios).map(([nombre, cantidad]) => ({
      nombre,
      cantidad
    }))
  }));
};

/**
 * Obtiene la cantidad total de manicuristas por provincia
 * @returns Promesa con las estadísticas de manicuristas por provincia
 */
export const obtenerEstadisticasPorProvincia = async () => {
  if (!Manicure.sequelize) {
    throw new Error('Sequelize instance is not available');
  }
  
  const resultado = await Manicure.findAll({
    attributes: [
      'provincia',
      [Manicure.sequelize.fn('COUNT', Manicure.sequelize.col('idusuario')), 'total'] as [any, string]
    ],
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: [],
      }
    ],
    group: ['provincia'],
    order: [['total', 'DESC']],
    raw: true
  });

  // Type assertion for the result
  return resultado as unknown as Array<{ provincia: string; total: number | string }>;
};

/**
 * Obtiene la cantidad de manicuristas por municipio de una provincia específica
 * @param provincia Nombre de la provincia para filtrar los municipios
 * @returns Promesa con las estadísticas de manicuristas por municipio de la provincia especificada
 */
/**
 * Obtiene estadísticas de reservaciones para los últimos 7 días o el último mes
 * @param periodo '7dias' para los últimos 7 días, 'mes' para el último mes
 * @returns Promesa con las estadísticas de reservaciones
 */
export const obtenerEstadisticasReservaciones = async (periodo: '7dias' | 'mes' = '7dias') => {
  if (!Reservacion.sequelize) {
    throw new Error('Sequelize instance is not available');
  }

  // Calcular las fechas de inicio según el período
  const hoy = new Date();
  const fechaInicio = new Date();
  
  if (periodo === '7dias') {
    fechaInicio.setDate(hoy.getDate() - 7);
  } else { // mes
    fechaInicio.setMonth(hoy.getMonth() - 1);
  }

  // Formatear fechas para la consulta
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = hoy.toISOString().split('T')[0];

  // Definir el tipo para los resultados de la consulta
  interface EstadisticaDia {
    fecha: string;
    totalReservas: string | number;
  }

  // Obtener estadísticas agrupadas por día
  const estadisticas = await Reservacion.findAll({
    attributes: [
      [fn('DATE', col('fecha')), 'fecha'],
      [fn('COUNT', col('id')), 'totalReservas']
    ],
    where: {
      fecha: {
        [Op.between]: [fechaInicio, hoy]
      },
      estado: 'confirmada' // Solo contar reservas confirmadas
    },
    group: [fn('DATE', col('fecha'))],
    order: [[fn('DATE', col('fecha')), 'ASC']],
    raw: true
  }) as unknown as EstadisticaDia[];

  // Procesar los resultados para incluir todos los días del período
  const resultados: Array<{fecha: string, totalReservas: number}> = [];
  const fechaActual = new Date(fechaInicio);
  
  while (fechaActual <= hoy) {
    const fechaStr = fechaActual.toISOString().split('T')[0];
    const estadisticaDia = estadisticas.find(e => e.fecha === fechaStr);
    
    resultados.push({
      fecha: fechaStr,
      totalReservas: estadisticaDia ? Number(estadisticaDia.totalReservas) : 0
    });
    
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  // Calcular totales
  const totalReservas = resultados.reduce((sum, item) => sum + item.totalReservas, 0);
  const promedioDiario = totalReservas / resultados.length;

  return {
    periodo: {
      inicio: fechaInicioStr,
      fin: fechaFinStr,
      tipo: periodo === '7dias' ? '7dias' : 'mes'
    },
    totalReservas,
    promedioDiario: parseFloat(promedioDiario.toFixed(2)),
    detallePorDia: resultados
  };
};

export const obtenerEstadisticasPorMunicipio = async (provincia: string) => {
  if (!Manicure.sequelize) {
    throw new Error('Sequelize instance is not available');
  }
  
  const resultado = await Manicure.findAll({
    attributes: [
      'municipio',
      [Manicure.sequelize.fn('COUNT', Manicure.sequelize.col('idusuario')), 'total'] as [any, string]
    ],
    where: { provincia },
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: [],
      }
    ],
    group: ['municipio'],
    order: [['total', 'DESC']],
    raw: true
  });

  // Type assertion for the result
  const typedResult = resultado as unknown as MunicipioStats[];
  
  return {
    provincia,
    municipios: typedResult,
    total: typedResult.reduce((sum, item) => sum + Number(item.total), 0)
  };
};

/**
 * Obtiene la cantidad de nuevos usuarios de la última semana
 * @returns Promesa con las estadísticas de nuevos usuarios
 */
export const obtenerNuevosUsuariosUltimaSemana = async () => {
  const hoy = new Date();
  const haceUnaSemana = new Date();
  haceUnaSemana.setDate(hoy.getDate() - 7);

  try {
    const [clientes, manicures] = await Promise.all([
      // Contar clientes nuevos de la última semana
      Usuario.count({
        where: {
          createdAt: {
            [Op.between]: [haceUnaSemana, hoy]
          },
          rol: 'cliente'
        }
      }),
      // Contar manicuristas nuevos de la última semana
      Usuario.count({
        where: {
          createdAt: {
            [Op.between]: [haceUnaSemana, hoy]
          },
          rol: 'manicure'
        }
      })
    ]);

    return {
      total: clientes + manicures,
      clientes,
      manicures,
      periodo: {
        inicio: haceUnaSemana.toISOString(),
        fin: hoy.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de nuevos usuarios:', error);
    throw error;
  }
};
