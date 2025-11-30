import { Router } from "express";
import {
  obtenerHorarios,
  obtenerHorarioPorId,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
  obtenerHorariosPorManicure,
  obtenerHorariosPaginated,
} from "../controllers/horario";
const AppError = require("../errors/AppError");
const authenticate = require("../middlewares/autenticarse");
const router = Router();

// Obtener todos los horarios (paginados)

// Obtener todos los horarios
router.get("/", authenticate(["manicure", "cliente"]), async (req, res, next) => {
  try {
    const horarios = await obtenerHorarios();
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
});



// Obtener horarios por manicure
router.get("/manicure/:manicureId", authenticate(["manicure", "cliente"]), async (req, res, next) => {
  try {
    const { manicureId } = req.params;
    const horarios = await obtenerHorariosPorManicure(manicureId);
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
});

// Obtener un horario por ID
router.get("/:id", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const horario = await obtenerHorarioPorId(parseInt(id));

    if (!horario) {
      throw new AppError("Horario no encontrado", 404);
    }

    res.status(200).json(horario);
  } catch (error) {
    next(error);
  }
});

router.get("/:page/:limit", authenticate(["manicure", "cliente"]), async (req, res, next) => {
  try {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);

    if (page < 1 || limit < 1) {
      throw new AppError("Parámetros de paginación inválidos", 400);
    }

    const horarios = await obtenerHorariosPaginated(page, limit);
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo horario
router.post("/", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { horaInicio, horaFinal, manicureId } = req.body;

    if (!horaInicio || !horaFinal || !manicureId) {
      throw new AppError("Todos los campos son requeridos", 400);
    }

    const horario = await crearHorario(horaInicio, horaFinal, manicureId);
    res.status(201).json(horario);
  } catch (error: any) {
    if (
      error.parent?.code === "23503" &&
      error.parent?.detail.includes("manicureid")
    ) {
      return next(new AppError("La manicure especificada no existe", 400));
    }
    next(error);
  }
});

// Actualizar un horario existente
router.put("/:id", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { horaInicio, horaFinal, manicureId } = req.body;

    if (!horaInicio || !horaFinal || !manicureId) {
      throw new AppError("Todos los campos son requeridos", 400);
    }

    const horario = await actualizarHorario(
      parseInt(id),
      horaInicio,
      horaFinal,
      manicureId
    );

    res.status(200).json(horario);
  } catch (error: any) {
    if (
      error.parent?.code === "23503" &&
      error.parent?.detail.includes("manicureid")
    ) {
      return next(new AppError("La manicure especificada no existe", 400));
    }
    next(error);
  }
});

// Eliminar un horario
router.delete("/:id", authenticate(["manicure"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    await eliminarHorario(parseInt(id));
    res.status(200).json({ message: "Horario eliminado correctamente" });
  } catch (error) {
    next(error);
  }
});

export default router;
