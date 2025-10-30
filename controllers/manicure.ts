import { Request as ExpressRequest, Response } from "express";
import Manicure from "../models/manicure";
import Usuario from "../models/usuario";
import { Op } from "sequelize";

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
