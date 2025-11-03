import { Op } from 'sequelize';
import Cliente from "../models/cliente";
import Reservacion from "../models/reservacion";
import Horario from "../models/horario";
import Usuario from "../models/usuario";
import Servicio from "../models/servicio";

export const obtenerClientesOrdenadosPorReservaciones = async (
  manicureidusuario: string
): Promise<any[]> => {
  if (!Cliente.sequelize) {
    throw new Error('Sequelize instance is not available');
  }

  const resultados = await Cliente.findAll({
    attributes: [
      'idusuario',
      'telefono',
      [Cliente.sequelize.fn('COUNT', Cliente.sequelize.col('reservaciones.id')), 'cantidad_reservaciones'] as [any, string]
    ],
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre'],
        required: true
      },
      {
        model: Reservacion,
        as: 'reservaciones',
        attributes: [],
        required: true,
        include: [
          {
            model: Horario,
            as: 'horario',
            attributes: [],
            required: true,
            where: { manicureidusuario }
          }
        ]
      }
    ],
    group: [
      Cliente.sequelize.col('Cliente.idusuario'),
      Cliente.sequelize.col('Cliente.telefono'),
      Cliente.sequelize.col('usuario.usuario'),
      Cliente.sequelize.col('usuario.nombre')
    ],
    order: [[Cliente.sequelize.literal('cantidad_reservaciones'), 'DESC']],
    raw: true
  });

  return resultados.map((row: any) => ({
    idusuario: row.idusuario,
    nombre: row['usuario.nombre'],
    telefono: row.telefono,
    cantidadReservaciones: parseInt(row.cantidad_reservaciones || '0', 10)
  }));

};

/**
 * Obtiene todas las reservaciones de un cliente autenticado
 * @param clienteId ID del cliente autenticado
 * @returns Lista de reservaciones del cliente
 */
export const obtenerReservacionesCliente = async (clienteId: string) => {
  return await Reservacion.findAll({
    where: { clienteidusuario: clienteId },
    include: [
      {
        model: Horario,
        as: 'horario',
      },
      {
        model: Servicio,
        as: 'servicio',
      }
    ],
    order: [['fecha', 'DESC']]
  });
};

/**
 * Obtiene las reservaciones de un cliente autenticado con paginación
 * @param clienteId ID del cliente autenticado
 * @param page Número de página (comenzando desde 1)
 * @param pageSize Cantidad de elementos por página
 * @returns Objeto con las reservaciones y metadatos de paginación
 */
export const obtenerReservacionesClientePaginadas = async (
  clienteId: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await Reservacion.findAndCountAll({
    where: { clienteidusuario: clienteId },
    include: [
      {
        model: Horario,
        as: 'horario',
      },
      {
        model: Servicio,
        as: 'servicio',
      }
    ],
    order: [['fecha', 'DESC']],
    limit: pageSize,
    offset: offset
  });

  return {
    reservaciones: rows,
    paginacion: {
      total: count,
      paginaActual: page,
      totalPaginas: Math.ceil(count / pageSize),
      porPagina: pageSize
    }
  };
};

