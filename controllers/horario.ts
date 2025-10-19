import Horario from "../models/horario";
import { Op } from "sequelize";
const AppError = require("../errors/AppError");

export const obtenerHorarios = async (): Promise<any> => {
  const { count, rows } = await Horario.findAndCountAll({
    order: [["horaInicio", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerHorariosPaginated = async (
  page: number,
  limit: number
): Promise<any> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Horario.findAndCountAll({
    order: [["horaInicio", "ASC"]],
    limit: limit,
    offset: offset,
  });

  return {
    count,
    rows,
  };
};

export const obtenerHorariosPorManicure = async (
  manicureId: string
): Promise<any> => {
  const horarios = await Horario.findAll({
    where: { manicureidusuario: manicureId },
    order: [["horaInicio", "ASC"]],
  });

  return horarios;
};

export const obtenerHorarioPorId = async (id: number) => {
  const horario = await Horario.findByPk(id);
  return horario;
};

export const crearHorario = async (
  horaInicio: string,
  horaFinal: string,
  manicureId: string
) => {
  // Verificar que no haya solapamiento de horarios
  const horarioExistente = await Horario.findOne({
    where: {
      manicureidusuario: manicureId,
      [Op.or]: [
        {
          horaInicio: { [Op.between]: [horaInicio, horaFinal] },
        },
        {
          horaFinal: { [Op.between]: [horaInicio, horaFinal] },
        },
        {
          [Op.and]: [
            { horaInicio: { [Op.lte]: horaInicio } },
            { horaFinal: { [Op.gte]: horaFinal } },
          ],
        },
      ],
    },
  });

  if (horarioExistente) {
    throw new AppError("El horario se solapa con un horario existente", 400);
  }

  const horario = await Horario.create({
    horaInicio,
    horaFinal,
    manicureidusuario: manicureId,
  });

  return horario;
};

export const actualizarHorario = async (
  id: number,
  horaInicio: string,
  horaFinal: string,
  manicureId: string
) => {
  // Verificar que no haya solapamiento de horarios (excluyendo el horario actual)
  const horarioExistente = await Horario.findOne({
    where: {
      id: { [Op.ne]: id },
      manicureidusuario: manicureId,
      [Op.or]: [
        {
          horaInicio: { [Op.between]: [horaInicio, horaFinal] },
        },
        {
          horaFinal: { [Op.between]: [horaInicio, horaFinal] },
        },
        {
          [Op.and]: [
            { horaInicio: { [Op.lte]: horaInicio } },
            { horaFinal: { [Op.gte]: horaFinal } },
          ],
        },
      ],
    },
  });

  if (horarioExistente) {
    throw new AppError("El horario se solapa con un horario existente", 400);
  }

  const [updated] = await Horario.update(
    {
      horaInicio,
      horaFinal,
      manicureidusuario: manicureId,
    },
    {
      where: { id },
      returning: true,
    }
  );

  if (updated === 0) {
    throw new AppError("Horario no encontrado", 404);
  }

  return await Horario.findByPk(id);
};

export const eliminarHorario = async (id: number) => {
  const deleted = await Horario.destroy({ where: { id } });

  if (deleted === 0) {
    throw new AppError("Horario no encontrado", 404);
  }

  return { success: true };
};
