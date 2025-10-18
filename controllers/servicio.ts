import Servicio from "../models/servicio";
import { Op } from "sequelize";

export const obtenerServiciosPaginated = async (
  page: number,
  limit: number,
  search: string = ""
): Promise<any> => {
  const offset = (page - 1) * limit;

  const whereClause = search
    ? {
        [Op.or]: [{ nombre: { [Op.iLike]: `%${search}%` } }],
      }
    : {};

  const { count, rows } = await Servicio.findAndCountAll({
    where: whereClause,

    order: [["nombre", "ASC"]],
    limit: limit,
    offset: offset,
  });

  return {
    count,
    rows,
  };
};

export const obtenerServicios = async (): Promise<any> => {
  const { count, rows } = await Servicio.findAndCountAll({
    order: [["nombre", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerServiciosPorManicure = async (
  manicureidusuario: string
): Promise<any> => {
  const { count, rows } = await Servicio.findAndCountAll({
    where: { manicureidusuario },
    order: [["nombre", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerServicioPorId = async (id: number) => {
  const servicio = await Servicio.findByPk(id, {
    include: [
      {
        association: "manicure",
      },
    ],
  });

  return servicio;
};

export const crearServicio = async (
  nombre: string,
  manicureidusuario: string,
  disponible: boolean = true
) => {
  const servicio = await Servicio.create({
    nombre,
    disponible,
    manicureidusuario,
  });

  return servicio;
};

export const actualizarServicio = async (
  id: number,
  nombre: string,
  disponible: boolean,
  manicureidusuario: string
) => {
  const [updated] = await Servicio.update(
    {
      nombre,
      disponible,
      manicureidusuario,
    },
    {
      where: { id },
      returning: true,
    }
  );

  if (updated === 0) {
    throw new Error("Servicio no encontrado");
  }
  return updated;
};

export const eliminarServicio = async (id: number) => {
  const deleted = await Servicio.destroy({ where: { id } });
  return deleted > 0;
};
