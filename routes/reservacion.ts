import { Router } from "express";
import {
  obtenerReservacionesPaginated,
  obtenerReservacionPorId,
  crearReservacion,
  obtenerReservaciones,
  eliminarReservacion,
  actualizarReservacion,
  obtenerReservacionesPorCliente,
  obtenerReservacionesPorEstado,
  cambiarEstadoReservacion,
  obtenerReservacionesDeHoyPorManicure,
  obtenerReservacionesPorManicureYEstado,
  obtenerTotalReservacionesAtendidasPorMes,
} from "../controllers/reservacion";
const AppError = require("../errors/AppError");
const authenticate = require("../middlewares/autenticarse");
const router = Router();

// Rutas CRUD para reservaciones
router.post("/", authenticate(["cliente"]), async (req, res, next) => {
  try {
    const {
      disenno,
      tamanno,
      precio,
      fecha,
      estado,
      horarioid,
      clienteidusuario,
      servicioid,
    } = req.body;

    if (

      !fecha ||
      !estado ||
      !horarioid ||
      !clienteidusuario ||
      !servicioid
    ) {
      throw new AppError(
        "Fecha, estado, horario, cliente y servicio son requeridos",
        400
      );
    }

    let reservacion = await crearReservacion(
      disenno,
      tamanno,
      precio,
      fecha,
      estado,
      horarioid,
      clienteidusuario,
      servicioid
    );

    res.status(201).json(reservacion);
  } catch (error: any) {
    console.log(error);
    if (
      error.parent?.detail?.includes("reservacion") &&
      error.parent?.code === "23505"
    ) {
      return next(new AppError("La reservación ya existe", 400));
    }

    next(error);
  }
});

// Obtener todas las reservaciones
router.get("/", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const manicureidusuario = req.userData?.usuario;

    if (!manicureidusuario) {
      throw new AppError("No se pudo identificar la manicure", 401);
    }

    const reservaciones = await obtenerReservaciones(manicureidusuario);

    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Obtener reservaciones de hoy por manicure
router.get("/hoy", authenticate(["manicure"]), async (req: any, res, next) => {
  try {
    const manicureidusuario = req.userData?.usuario;
    if (!manicureidusuario) {
      throw new AppError("No se pudo identificar la manicure", 401);
    }
    const reservaciones = await obtenerReservacionesDeHoyPorManicure(manicureidusuario);
    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Obtener reservación por id
router.get("/:id", authenticate(["cliente", "manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservacion = await obtenerReservacionPorId(parseInt(id));

    if (!reservacion) {
      throw new AppError("Reservación no encontrada", 404);
    }

    res.status(200).json(reservacion);
  } catch (error) {
    next(error);
  }
});

// Actualizar reservación
router.put("/:id", authenticate(["cliente"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      disenno,
      tamanno,
      precio,
      fecha,
      estado,
      horarioid,
      clienteidusuario,
      servicioid,
    } = req.body;

    if (
      !precio ||
      !fecha ||
      !estado ||
      !horarioid ||
      !clienteidusuario ||
      !servicioid
    ) {
      throw new AppError(
        "Precio, fecha, estado, horario, cliente y servicio son requeridos",
        400
      );
    }

    await actualizarReservacion(
      parseInt(id),
      disenno,
      tamanno,
      precio,
      fecha,
      estado,
      horarioid,
      clienteidusuario,
      servicioid
    );

    res.status(200).json({ message: "Reservación actualizada" });
  } catch (error: any) {
    console.log(error);
    next(error);
  }
});

// Eliminar reservación
router.delete("/:id", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError("ID de reservación es requerido", 400);
    }

    const result = await eliminarReservacion(parseInt(id));

    if (result == 0) {
      throw new AppError("Reservación no encontrada", 404);
    }

    res.status(200).json({ message: "Reservación eliminada" });
  } catch (error) {
    next(error);
  }
});

// Rutas adicionales para consultas específicas
router.get("/cliente/:clienteidusuario", authenticate(["cliente"]), async (req, res, next) => {
  try {
    const { clienteidusuario } = req.params;
    const reservaciones = await obtenerReservacionesPorCliente(
      clienteidusuario
    );

    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Obtener reservaciones por estado
router.get("/estado/:estado", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { estado } = req.params;
    const reservaciones = await obtenerReservacionesPorEstado(estado);

    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Obtener reservaciones paginadas
router.get("/:page/:limit", authenticate(["cliente", "manicure"]), async (req, res, next) => {
  try {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);
    const manicureidusuario = req.userData?.usuario;

    if (!manicureidusuario) {
      throw new AppError("No se pudo identificar la manicure", 401);
    }

    if (page < 1 || limit < 1) {
      throw new AppError("Parámetros de paginación inválidos", 400);
    }

    const reservaciones = await obtenerReservacionesPaginated(page, limit, manicureidusuario);
    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Ruta para cambiar el estado de una reservación específica
router.patch("/:id/estado", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, precio } = req.body;

    if (!estado) {
      throw new AppError("Estado es requerido", 400);
    }

    // Si se proporciona precio, validar que sea un número válido
    if (precio !== undefined && precio < 0) {
      throw new AppError(
        "El precio debe ser un número válido mayor o igual a 0",
        400
      );
    }

    await cambiarEstadoReservacion(parseInt(id), estado, parseFloat(precio));

    res.status(200).json({
      message: "Estado de reservación actualizado correctamente",
    });
  } catch (error) {
    next(error);
  }
});

// Obtener reservaciones por manicure y estado
router.get("/manicure/estado/:estado", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { estado } = req.params;
    const manicureidusuario = req.userData?.usuario;

    if (!manicureidusuario || !estado || !manicureidusuario.trim() || !estado.trim()) {
      throw new AppError("manicureidusuario y estado son requeridos", 400);
    }
    const reservaciones = await obtenerReservacionesPorManicureYEstado(manicureidusuario, estado);
    if (!reservaciones || reservaciones.count === 0 || (Array.isArray(reservaciones.rows) && reservaciones.rows.length === 0)) {
      throw new AppError("No se encontraron reservaciones para los criterios proporcionados", 404);
    }
    res.status(200).json(reservaciones);
  } catch (error) {
    next(error);
  }
});

// Ruta para obtener el total de reservaciones atendidas por manicure en un mes dado
router.get("/manicure/atendidas/:anio/:mes", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const manicureidusuario = req.userData?.usuario;

    const { anio, mes } = req.params;

    if (!manicureidusuario || !manicureidusuario.trim()) {
      throw new AppError("manicureidusuario es requerido", 400);
    }

    const añoNum = parseInt(anio);
    const mesNum = parseInt(mes);

    if (isNaN(añoNum) || añoNum < 2000 || añoNum > 2100) {
      throw new AppError("El año debe ser un número válido entre 2000 y 2100", 400);
    }

    if (isNaN(mesNum)) {
      throw new AppError("El mes debe ser un número válido", 400);
    }

    const total = await obtenerTotalReservacionesAtendidasPorMes(
      manicureidusuario,
      añoNum,
      mesNum
    );

    res.status(200).json({
      manicureidusuario,
      año: añoNum,
      mes: mesNum,
      totalReservacionesAtendidas: total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
