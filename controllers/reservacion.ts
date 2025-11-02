import Reservacion from "../models/reservacion";
import Cliente from "../models/cliente";
import Horario from "../models/horario";
import Servicio from "../models/servicio";
import * as notificacionController from "./notificacion";
const AppError = require("../errors/AppError");
import { Op } from "sequelize";


export const obtenerReservacionesPaginated = async (
  page: number,
  limit: number
): Promise<any> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Reservacion.findAndCountAll({
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: false },
      { model: Servicio, as: "servicio", required: false },
    ],
    order: [["fecha", "DESC"]],
    limit: limit,
    offset: offset,
  });

  return {
    count,
    rows,
  };
};

export const obtenerReservaciones = async (): Promise<any> => {
  const { count, rows } = await Reservacion.findAndCountAll({
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: false },
      { model: Servicio, as: "servicio", required: false },
    ],
    order: [["fecha", "DESC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerReservacionPorId = async (id: number) => {
  const reservacion = await Reservacion.findByPk(id, {
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: false },
      { model: Servicio, as: "servicio", required: false },
    ],
  });

  return reservacion;
};

export const crearReservacion = async (
  disenno: string | undefined,
  tamanno: string | undefined,
  precio: number,
  fecha: Date,
  estado: "pendiente" | "confirmada" | "completada" | "cancelada",
  horarioid: number,
  clienteidusuario: string,
  servicioid: number
) => {
  const reservacion = await Reservacion.create({
    disenno,
    tamanno,
    precio,
    fecha,
    estado,
    horarioid,
    clienteidusuario,
    servicioid,
  });

  // Obtener el horario para conseguir el manicureidusuario
  const horario = await Horario.findByPk(horarioid);
  if (horario) {
    // Enviar notificación a la manicure
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
    const mensaje = `Nueva reservación creada para el ${fechaFormateada}. Estado: ${estado}`;
    await notificacionController.crearNotificacionParaManicure(
      reservacion.id,
      mensaje,
      horario.manicureidusuario
    );
  }

  return reservacion;
};

export const actualizarReservacion = async (
  id: number,
  disenno: string | undefined,
  tamanno: string | undefined,
  precio: number,
  fecha: Date,
  estado: "pendiente" | "confirmada" | "completada" | "cancelada",
  horarioid: number,
  clienteidusuario: string,
  servicioid: number
) => {
  // Crear objeto con los datos a actualizar
  const updateData: any = {
    disenno,
    tamanno,
    precio,
    fecha,
    estado,
    horarioid,
    clienteidusuario,
    servicioid,
  };

  // Actualizar la reservación usando el método update de Sequelize
  const [updated] = await Reservacion.update(updateData, {
    where: { id },
    returning: true,
  });

  if (updated === 0) {
    throw new AppError("Reservación no encontrada");
  }

  // Obtener el horario para conseguir el manicureidusuario
  const horario = await Horario.findByPk(horarioid);
  if (horario) {
    // Enviar notificación a la manicure
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
    const mensaje = `Reservación #${id} modificada para el ${fechaFormateada}. Nuevo estado: ${estado}`;
    await notificacionController.crearNotificacionParaManicure(
      id,
      mensaje,
      horario.manicureidusuario
    );
  }
};

export const eliminarReservacion = async (id: number) => {
  // Obtener la reservación antes de eliminarla para enviar notificación
  const reservacion = await Reservacion.findByPk(id, {
    include: [{ model: Horario, as: "horario" }],
  });

  if (reservacion) {
    const horario = await Horario.findByPk(reservacion.horarioid);
    if (horario) {
      // Enviar notificación a la manicure
      const fechaFormateada = new Date(reservacion.fecha).toLocaleDateString('es-ES');
      const mensaje = `Reservación #${id} cancelada para el ${fechaFormateada}`;
      await notificacionController.crearNotificacionParaManicure(
        id,
        mensaje,
        horario.manicureidusuario
      );
    }
  }

  const deleted = await Reservacion.destroy({ where: { id } });
  return deleted;
};

export const obtenerReservacionesPorCliente = async (
  clienteidusuario: string
) => {
  const { count, rows } = await Reservacion.findAndCountAll({
    where: { clienteidusuario },
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: false },
      { model: Servicio, as: "servicio", required: false },
    ],
    order: [["fecha", "DESC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerReservacionesPorEstado = async (estado: string) => {
  const { count, rows } = await Reservacion.findAndCountAll({
    where: { estado },
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: false },
      { model: Servicio, as: "servicio", required: false },
    ],
    order: [["fecha", "DESC"]],
  });

  return {
    count,
    rows,
  };
};

export const cambiarEstadoReservacion = async (
  id: number,
  nuevoEstado: "pendiente" | "confirmada" | "completada" | "cancelada",
  precio?: number
) => {
  // Obtener la reservación antes de actualizar para enviar notificación al cliente
  const reservacion = await Reservacion.findByPk(id);
  if (!reservacion) {
    throw new AppError("Reservación no encontrada");
  }

  // Crear objeto con los datos a actualizar
  const updateData: any = {
    estado: nuevoEstado.toLowerCase(),
  };

  // Si el estado es completada y se proporciona un precio, actualizarlo también
  if (nuevoEstado.toLowerCase() === "completada" && precio !== undefined) {
    if (typeof precio !== "number" || precio < 0) {
      throw new AppError(
        "El precio debe ser un número válido mayor o igual a 0"
      );
    }
    updateData.precio = precio;
  }

  // Si el estado es completada pero no se proporciona precio, solo actualizar el estado
  // Si el estado no es completada, no actualizar el precio incluso si se proporciona

  // Actualizar la reservación
  const [updated] = await Reservacion.update(updateData, {
    where: { id },
    returning: true,
  });

  if (updated === 0) {
    throw new AppError("Reservación no encontrada");
  }

  // Enviar notificación al cliente sobre el cambio de estado
  const estadoTexto = {
    pendiente: "pendiente",
    confirmada: "confirmada",
    completada: "completada",
    cancelada: "cancelada"
  }[nuevoEstado.toLowerCase()] || nuevoEstado;

  const fechaFormateada = new Date(reservacion.fecha).toLocaleDateString('es-ES');
  const mensaje = `El estado de tu reservación #${id} del ${fechaFormateada} ha cambiado a: ${estadoTexto}`;
  
  await notificacionController.crearNotificacionParaCliente(
    id,
    mensaje,
    reservacion.clienteidusuario
  );
};

// Obtener reservaciones de hoy por manicure
export const obtenerReservacionesDeHoyPorManicure = async (
  manicureidusuario: string
) => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyStr = `${yyyy}-${mm}-${dd}`; // Reservacion.fecha es DATEONLY (YYYY-MM-DD)

  const { count, rows } = await Reservacion.findAndCountAll({
    where: { fecha: hoyStr },
    include: [
      { model: Cliente, as: "cliente", required: false },
      {
        model: Horario,
        as: "horario",
        required: true,
        where: { manicureidusuario },
      },
      { model: Servicio, as: "servicio", required: false },
    ],
    order: [["fecha", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

// Obtener reservaciones por estado y manicure
export const obtenerReservacionesPorManicureYEstado = async (
  manicureidusuario: string,
  estado: string
) => {
  const { count, rows } = await Reservacion.findAndCountAll({
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Horario, as: "horario", required: true, where: { manicureidusuario } },
      { model: Servicio, as: "servicio", required: false }
    ],
    where: { estado },
    order: [["fecha", "DESC"]],
  });
  return { count, rows };
};

// Obtener total de reservaciones atendidas (completadas) por manicure en un mes dado
export const obtenerTotalReservacionesAtendidasPorMes = async (
  manicureidusuario: string,
  año: number,
  mes: number
): Promise<number> => {

  if (mes < 1 || mes > 12) {
    throw new AppError("El mes debe estar entre 1 y 12", 400);
  }

  const fechaInicio = new Date(año, mes - 1, 1);
  const fechaFin = new Date(año, mes, 0); 

  const fechaInicioStr = `${año}-${String(mes).padStart(2, "0")}-01`;
  const fechaFinStr = `${año}-${String(mes).padStart(2, "0")}-${String(fechaFin.getDate()).padStart(2, "0")}`;

  const { count } = await Reservacion.findAndCountAll({
    where: {
      estado: "completada",
      fecha: {
        [Op.between]: [fechaInicioStr, fechaFinStr],
      },
    },
    include: [
      {
        model: Horario,
        as: "horario",
        required: true,
        where: { manicureidusuario },
      },
    ],
  });

  return count;
};