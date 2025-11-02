import Cliente from "../models/cliente";
import Reservacion from "../models/reservacion";
import Horario from "../models/horario";
import Usuario from "../models/usuario";

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
      Cliente.sequelize.col('cliente.idusuario'),
      Cliente.sequelize.col('cliente.telefono'),
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

