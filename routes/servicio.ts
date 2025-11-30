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
    const { nombre, disponible } = req.body;
    const manicureidusuario = (req as any).userData?.usuario;

    if (!nombre) {
      throw new AppError("El nombre del servicio es requerido", 400);
    }

    if (!manicureidusuario) {
      throw new AppError("No se pudo determinar el usuario autenticado", 401);
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

    const { nombre, disponible } = req.body;
    const manicureidusuario = (req as any).userData?.usuario;

    if (!manicureidusuario) {
      throw new AppError("No se pudo determinar el usuario autenticado", 401);
    }

    if (!nombre && disponible === undefined) {
      throw new AppError("Se requiere al menos un campo para actualizar", 400);
    }

    // Verificar que el servicio pertenezca al usuario
    const servicioExistente = await obtenerServicioPorId(id);
    if (!servicioExistente) {
      throw new AppError("Servicio no encontrado", 404);
    }

    if ((servicioExistente as any).manicureidusuario !== manicureidusuario) {
      throw new AppError("No tienes permisos para actualizar este servicio", 403);
    }

    const servicio = await actualizarServicio(
      id,
      nombre || (servicioExistente as any).nombre,
      disponible !== undefined ? disponible : (servicioExistente as any).disponible,
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

    const manicureidusuario = (req as any).userData?.usuario;
    if (!manicureidusuario) {
      throw new AppError("No se pudo determinar el usuario autenticado", 401);
    }

    // Verificar que el servicio pertenezca al usuario
    const servicioExistente = await obtenerServicioPorId(id);
    if (!servicioExistente) {
      throw new AppError("Servicio no encontrado", 404);
    }

    if ((servicioExistente as any).manicureidusuario !== manicureidusuario) {
      throw new AppError("No tienes permisos para eliminar este servicio", 403);
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
