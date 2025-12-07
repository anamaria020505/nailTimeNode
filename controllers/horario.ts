import Horario from "../models/horario";
import Reservacion from "../models/reservacion";
import database from "../config/database";
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

export const obtenerDisponiblesPorFecha = async (
  manicureId: string,
  fecha: string
) => {
  // 1. Obtener todos los horarios de la manicure
  const horarios = await Horario.findAll({
    where: { manicureidusuario: manicureId },
    order: [["horaInicio", "ASC"]],
  });

  if (!horarios.length) return [];

  const horarioIds = horarios.map((h) => h.id);

  // 2. Obtener reservaciones para esa fecha y esos horarios
  const reservaciones = await Reservacion.findAll({
    where: {
      fecha: fecha,
      estado: { [Op.ne]: "cancelada" },
      horarioid: { [Op.in]: horarioIds },
    },
  });

  // 3. Filtrar horarios que ya están reservados
  const horariosReservadosIds = reservaciones.map((r) => r.horarioid);
  const disponibles = horarios.filter(
    (h) => !horariosReservadosIds.includes(h.id)
  );

  return disponibles;
};

export const obtenerFechasDisponibles = async (
  manicureId: string,
  fechaInicio: string,
  fechaFin: string
) => {
  // 1. Obtener total de slots por día (asumiendo horarios fijos para todos los días)
  const horarios = await Horario.findAll({
    where: { manicureidusuario: manicureId },
  });

  const totalSlots = horarios.length;
  if (totalSlots === 0) return { fechas: [] };

  const horarioIds = horarios.map((h) => h.id);

  // 2. Obtener conteo de reservaciones por fecha en el rango
  const reservaciones = await Reservacion.findAll({
    attributes: [
      "fecha",
      [database.fn("COUNT", database.col("id")), "count"],
    ],
    where: {
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
      estado: { [Op.ne]: "cancelada" },
      horarioid: { [Op.in]: horarioIds },
    },
    group: ["fecha"],
    raw: true,
  }) as unknown as Array<{ fecha: string; count: string }>;

  // Mapa de fecha -> cantidad de reservas
  const reservasPorFecha: Record<string, number> = {};
  reservaciones.forEach((r) => {
    reservasPorFecha[r.fecha] = parseInt(r.count, 10);
  });

  // 3. Generar lista de fechas disponibles
  const fechasDisponibles: string[] = [];
  let currentDate = new Date(fechaInicio);
  const endDate = new Date(fechaFin);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const reservasCount = reservasPorFecha[dateStr] || 0;

    if (reservasCount < totalSlots) {
      fechasDisponibles.push(dateStr);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { fechas: fechasDisponibles };
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
  if (horaInicio >= horaFinal) {
    throw new AppError("La hora de inicio debe ser menor que la hora final", 400);
  }

  console.log('Checking overlap for:', { horaInicio, horaFinal, manicureId });

  // Verificar que no haya solapamiento de horarios
  const horarioExistente = await Horario.findOne({
    where: {
      manicureidusuario: manicureId,
      horaInicio: { [Op.lt]: horaFinal },
      horaFinal: { [Op.gt]: horaInicio },
    },
  });

  if (horarioExistente) {
    console.log('Overlap found with:', horarioExistente.toJSON());
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
  if (horaInicio >= horaFinal) {
    throw new AppError("La hora de inicio debe ser menor que la hora final", 400);
  }

  // Verificar que no haya solapamiento de horarios (excluyendo el horario actual)
  const horarioExistente = await Horario.findOne({
    where: {
      id: { [Op.ne]: id },
      manicureidusuario: manicureId,
      horaInicio: { [Op.lt]: horaFinal },
      horaFinal: { [Op.gt]: horaInicio },
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
