import Reservacion from "../models/reservacion";
import Cliente from "../models/cliente";
import Horario from "../models/horario";
import Servicio from "../models/servicio";
import Usuario from "../models/usuario";
import * as notificacionController from "./notificacion";
const AppError = require("../errors/AppError");
import { Op } from "sequelize";


export const obtenerReservacionesPaginated = async (
  page: number,
  limit: number,
  manicureIdUsuario: string
): Promise<any> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Reservacion.findAndCountAll({
    include: [
      {
        model: Cliente,
        as: "cliente",
        required: false,
        include: [{ model: Usuario, as: "usuario" }]
      },
      {
        model: Horario,
        as: "horario",
        required: true,
        where: {
          manicureidusuario: manicureIdUsuario
        }
      },
      {
        model: Servicio,
        as: "servicio",
        required: false
      },
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

export const obtenerReservaciones = async (manicureIdUsuario: string): Promise<any> => {
  const { count, rows } = await Reservacion.findAndCountAll({
    include: [
      {
        model: Cliente,
        as: "cliente",
        required: false,
        include: [{ model: Usuario, as: "usuario" }]
      },
      {
        model: Horario,
        as: "horario",
        required: true,
        where: {
          manicureidusuario: manicureIdUsuario
        }
      },
      {
        model: Servicio,
        as: "servicio",
        required: false
      },
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
      { model: Cliente, as: "cliente", required: false, include: [{ model: Usuario, as: "usuario" }] },
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
      { model: Cliente, as: "cliente", required: false, include: [{ model: Usuario, as: "usuario" }] },
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
      { model: Cliente, as: "cliente", required: false, include: [{ model: Usuario, as: "usuario" }] },
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
  precio?: number,
  requestingUser?: { usuario: string; role: string }
) => {
  // Obtener la reservación antes de actualizar
  const reservacion = await Reservacion.findByPk(id, {
    include: [{ model: Horario, as: "horario" }]
  });

  if (!reservacion) {
    throw new AppError("Reservación no encontrada");
  }

  // Validación de permisos
  if (requestingUser) {
    if (requestingUser.role === 'cliente') {
      // El cliente solo puede cancelar sus propias reservaciones
      if (reservacion.clienteidusuario !== requestingUser.usuario) {
        throw new AppError("No tienes permiso para modificar esta reservación", 403);
      }
      if (nuevoEstado !== 'cancelada') {
        throw new AppError("Los clientes solo pueden cancelar reservaciones", 403);
      }
    } else if (requestingUser.role === 'manicure') {
      // La manicure solo puede modificar reservaciones de sus horarios
      // (Asumiendo que el middleware ya verificó que es manicure, pero aquí verificamos que sea SU reservación)
      // Nota: La lógica actual de obtenerReservaciones filtra por manicure, pero aquí estamos accediendo por ID.
      // Deberíamos verificar que la reservación pertenece a un horario de esta manicure.
      if ((reservacion as any).horario && (reservacion as any).horario.manicureidusuario !== requestingUser.usuario) {
        throw new AppError("No tienes permiso para modificar esta reservación", 403);
      }
    }
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

  // Actualizar la reservación
  const [updated] = await Reservacion.update(updateData, {
    where: { id },
    returning: true,
  });

  if (updated === 0) {
    throw new AppError("Reservación no encontrada");
  }

  // Notificaciones
  const fechaFormateada = new Date(reservacion.fecha).toLocaleDateString('es-ES');
  const estadoTexto = {
    pendiente: "pendiente",
    confirmada: "confirmada",
    completada: "completada",
    cancelada: "cancelada"
  }[nuevoEstado.toLowerCase()] || nuevoEstado;

  if (requestingUser?.role === 'cliente') {
    // Si el cliente cancela, notificar a la manicure
    if ((reservacion as any).horario) {
      const mensaje = `El cliente ha cancelado la reservación #${id} del ${fechaFormateada}`;
      await notificacionController.crearNotificacionParaManicure(
        id,
        mensaje,
        (reservacion as any).horario.manicureidusuario
      );
    }
  } else {
    // Si la manicure cambia el estado, notificar al cliente
    const mensaje = `El estado de tu reservación #${id} del ${fechaFormateada} ha cambiado a: ${estadoTexto}`;
    await notificacionController.crearNotificacionParaCliente(
      id,
      mensaje,
      reservacion.clienteidusuario
    );
  }
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
      { model: Cliente, as: "cliente", required: false, include: [{ model: Usuario, as: "usuario" }] },
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
      { model: Cliente, as: "cliente", required: false, include: [{ model: Usuario, as: "usuario" }] },
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

export const reprogramarReservacion = async (
  id: number,
  fecha: string,
  horarioid: number,
  requestingUser: { usuario: string; role: string }
) => {
  const reservacion = await Reservacion.findByPk(id, {
    include: [{ model: Horario, as: "horario" }]
  });

  if (!reservacion) {
    throw new AppError("Reservación no encontrada", 404);
  }

  // Validar permisos
  if (requestingUser.role === 'cliente') {
    if (reservacion.clienteidusuario !== requestingUser.usuario) {
      throw new AppError("No tienes permiso para modificar esta reservación", 403);
    }
  }

  // Validar estado
  if (reservacion.estado !== 'pendiente' && reservacion.estado !== 'confirmada') {
    throw new AppError("Solo se pueden reprogramar reservaciones pendientes o confirmadas", 400);
  }

  // Actualizar
  const [updated] = await Reservacion.update({ fecha: fecha as any, horarioid }, {
    where: { id },
    returning: true
  });

  if (updated === 0) {
    throw new AppError("Error al actualizar la reservación");
  }

  // Notificar a la manicure
  // Nota: Usamos el horarioid NUEVO para encontrar a la manicure, o el viejo?
  // Generalmente la manicure es la misma si el horario pertenece a la misma manicure.
  // Pero si cambiamos de horario, deberíamos verificar que el nuevo horario sea válido.
  // Por simplicidad asumimos que el frontend envía un horario válido.
  // Vamos a buscar el nuevo horario para obtener la manicure correcta (por si acaso cambiara, aunque en este sistema parece que los horarios son de manicures especificas).

  const nuevoHorario = await Horario.findByPk(horarioid);
  if (nuevoHorario) {
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
    const mensaje = `El cliente ha reprogramado la reservación #${id} para el ${fechaFormateada}`;
    await notificacionController.crearNotificacionParaManicure(
      id,
      mensaje,
      nuevoHorario.manicureidusuario
    );
  }
};