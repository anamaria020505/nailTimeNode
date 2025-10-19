import Notificacion from "../models/notificacion";
import Reservacion from "../models/reservacion";
import Cliente from "../models/cliente";
import Horario from "../models/horario";
import Servicio from "../models/servicio";
const AppError = require("../errors/AppError");

// Crear notificación para la manicure (cuando el cliente crea/modifica/cancela una reservación)
export const crearNotificacionParaManicure = async (
  reservacionid: number,
  mensaje: string,
  manicureidusuario: string
) => {
  const notificacion = await Notificacion.create({
    mensaje,
    reservacionid,
    manicureidusuario,
    clienteidusuario: null,
    leido: false,
  });

  return notificacion;
};

// Crear notificación para el cliente (cuando la manicure cambia el estado de una reservación)
export const crearNotificacionParaCliente = async (
  reservacionid: number,
  mensaje: string,
  clienteidusuario: string
) => {
  const notificacion = await Notificacion.create({
    mensaje,
    reservacionid,
    manicureidusuario: null,
    clienteidusuario,
    leido: false,
  });

  return notificacion;
};

// Obtener todas las notificaciones según el rol del usuario
export const obtenerNotificaciones = async (
  idusuario: string,
  rol: "cliente" | "manicure",
  soloNoLeidas: boolean = false
) => {
  const whereClause: any = {};

  // Determinar el campo según el rol
  if (rol === "cliente") {
    whereClause.clienteidusuario = idusuario;
  } else if (rol === "manicure") {
    whereClause.manicureidusuario = idusuario;
  } else {
    throw new AppError("Rol inválido. Debe ser 'cliente' o 'manicure'");
  }

  // Agregar filtro de no leídas si se solicita
  if (soloNoLeidas) {
    whereClause.leido = false;
  }

  const notificaciones = await Notificacion.findAll({
    where: whereClause,
    include: [
      {
        model: Reservacion,
        as: "reservacion",
        include: [
          { model: Cliente, as: "cliente" },
          { model: Horario, as: "horario" },
          { model: Servicio, as: "servicio" },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return notificaciones;
};

// Contar notificaciones no leídas según el rol del usuario
export const contarNotificacionesNoLeidas = async (
  idusuario: string,
  rol: "cliente" | "manicure"
) => {
  const whereClause: any = { leido: false };

  // Determinar el campo según el rol
  if (rol === "cliente") {
    whereClause.clienteidusuario = idusuario;
  } else if (rol === "manicure") {
    whereClause.manicureidusuario = idusuario;
  } else {
    throw new AppError("Rol inválido. Debe ser 'cliente' o 'manicure'");
  }

  const count = await Notificacion.count({
    where: whereClause,
  });

  return { count };
};

// Marcar una notificación como leída
export const marcarNotificacionComoLeida = async (id: number) => {
  const [updated] = await Notificacion.update(
    { leido: true },
    { where: { id } }
  );

  if (updated === 0) {
    throw new AppError("Notificación no encontrada");
  }

  return await Notificacion.findByPk(id);
};

// Marcar todas las notificaciones como leídas según el rol del usuario
export const marcarTodasLeidas = async (
  idusuario: string,
  rol: "cliente" | "manicure"
) => {
  const whereClause: any = { leido: false };

  // Determinar el campo según el rol
  if (rol === "cliente") {
    whereClause.clienteidusuario = idusuario;
  } else if (rol === "manicure") {
    whereClause.manicureidusuario = idusuario;
  } else {
    throw new AppError("Rol inválido. Debe ser 'cliente' o 'manicure'");
  }

  await Notificacion.update({ leido: true }, { where: whereClause });

  return { mensaje: "Todas las notificaciones marcadas como leídas" };
};

// Eliminar una notificación
export const eliminarNotificacion = async (id: number) => {
  const deleted = await Notificacion.destroy({ where: { id } });

  if (deleted === 0) {
    throw new AppError("Notificación no encontrada");
  }

  return { mensaje: "Notificación eliminada exitosamente" };
};
