import { Router } from "express";
import {
  obtenerServiciosPaginated,
  obtenerServicioPorId,
  crearServicio,
  obtenerServicios,
  obtenerServiciosPorManicure,
  eliminarServicio,
  actualizarServicio,
  
} from "../controllers/servicio";

const AppError = require("../errors/AppError");
const authenticate = require("../middlewares/autenticarse");
const router = Router();

// Obtener servicios por manicureid
router.get("/manicure/:manicureid",  authenticate(["manicure","cliente"]), async (req, res, next) => {
  try {
    const manicureid = req.params.manicureid;
    if (!manicureid) {
      throw new AppError("ID de manicure requerido", 400);
    }

    const servicios = await obtenerServiciosPorManicure(manicureid);

    res.status(200).json(servicios);
  } catch (error) {
    next(error);
  }
});

// Obtener todos los servicios con paginación
router.get("/:page/:limit", authenticate(["manicure"]),  async (req, res, next) => {
  try {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);
    const search = (req.query.search as string) || "";

    if (page < 1 || limit < 1) {
      throw new AppError("Parámetros de paginación inválidos", 400);
    }

    const servicios = await obtenerServiciosPaginated(page, limit, search);
    res.status(200).json(servicios);
  } catch (error) {
    next(error);
  }
});

// Obtener todos los servicios
router.get("/",  authenticate(["manicure"]), async (req, res, next) => {
  try {
    const servicios = await obtenerServicios();
    res.status(200).json(servicios);
  } catch (error) {
    next(error);
  }
});

// Obtener un servicio por ID
router.get("/:id", authenticate(["manicure"]),  async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("ID de servicio no válido", 400);
    }

    const servicio = await obtenerServicioPorId(id);

    if (!servicio) {
      throw new AppError("Servicio no encontrado", 404);
    }

    res.status(200).json(servicio);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo servicio
router.post("/", authenticate(["manicure"]),  async (req, res, next) => {
  try {
    const { nombre, manicureidusuario, disponible } = req.body;

    if (!nombre || !manicureidusuario) {
      throw new AppError("Nombre y ID de manicure son campos requeridos", 400);
    }

    const servicio = await crearServicio(
      nombre,
      manicureidusuario,
      disponible !== undefined ? disponible : true
    );

    res.status(201).json(servicio);
  } catch (error: any) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return next(
        new AppError("El ID de manicure proporcionado no existe", 400)
      );
    }
    next(error);
  }
});

// Actualizar un servicio
router.put("/:id", authenticate(["manicure"]),  async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("ID de servicio no válido", 400);
    }

    const { nombre, disponible, manicureidusuario } = req.body;

    if (!nombre && disponible === undefined && !manicureidusuario) {
      throw new AppError("Se requiere al menos un campo para actualizar", 400);
    }

    const servicio = await actualizarServicio(
      id,
      nombre,
      disponible,
      manicureidusuario
    );

    res.status(200).json({ message: "Servicio actualizado correctamente" });
  } catch (error) {
    next(error);
  }
});

// Eliminar un servicio
router.delete("/:id", authenticate(["manicure"]),  async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("ID de servicio no válido", 400);
    }

    const deleted = await eliminarServicio(id);

    if (!deleted) {
      throw new AppError("Servicio no encontrado", 404);
    }

    res.status(200).json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    next(error);
  }
});

export default router;
