import { Router } from "express";
import {
  obtenerDisennosPaginated,
  obtenerDisennos,
  obtenerDisennosPorManicure,
  obtenerDisennoPorId,
  crearDisenno,
  actualizarDisenno,
  eliminarDisenno,
} from "../controllers/disenno";
import { uploadDisenio } from "../config/multer";
import path from "path";
import fs from "fs";
const AppError = require("../errors/AppError");

const router = Router();

// Crear un nuevo diseño con imagen
router.post("/", uploadDisenio.single("imagen"), async (req, res, next) => {
  try {
    const { manicureidusuario } = req.body;

    if (!manicureidusuario) {
      throw new AppError("El ID del manicure es requerido", 400);
    }

    if (!req.file) {
      throw new AppError("La imagen es requerida", 400);
    }

    // La URL será solo el nombre del archivo (sin 'uploads')
    const url = `disenios/${req.file.filename}`;

    const disenno = await crearDisenno(url, manicureidusuario);

    res.status(201).json(disenno);
  } catch (error: any) {
    // Si hay error y se subió un archivo, eliminarlo
    if (req.file) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../", req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
});

// Obtener imagen por URL
router.get("/imagen", async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      throw new AppError("La URL de la imagen es requerida", 400);
    }

    // Construir la ruta completa del archivo (agregar 'uploads' al inicio)
    const filePath = path.join(__dirname, "../uploads", url);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new AppError("Imagen no encontrada", 404);
    }

    // Verificar que la ruta está dentro del directorio uploads (seguridad)
    const uploadsDir = path.join(__dirname, "../uploads");
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      throw new AppError("Acceso no autorizado", 403);
    }

    // Enviar el archivo
    res.sendFile(resolvedPath);
  } catch (error) {
    next(error);
  }
});

// Obtener todos los diseños
router.get("/", async (req, res, next) => {
  try {
    const disenios = await obtenerDisennos();
    res.status(200).json(disenios);
  } catch (error) {
    next(error);
  }
});

// Obtener diseños con paginación
router.get("/paginated/:page/:limit", async (req, res, next) => {
  try {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);

    if (page < 1 || limit < 1) {
      throw new AppError("Parámetros de paginación inválidos", 400);
    }

    const disenios = await obtenerDisennosPaginated(page, limit);
    res.status(200).json(disenios);
  } catch (error) {
    next(error);
  }
});

// Obtener diseños por manicure
router.get("/manicure/:manicureidusuario", async (req, res, next) => {
  try {
    const { manicureidusuario } = req.params;

    if (!manicureidusuario) {
      throw new AppError("El ID del manicure es requerido", 400);
    }

    const disenios = await obtenerDisennosPorManicure(manicureidusuario);
    res.status(200).json(disenios);
  } catch (error) {
    next(error);
  }
});

// Obtener un diseño por ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new AppError("ID inválido", 400);
    }

    const disenno = await obtenerDisennoPorId(id);

    if (!disenno) {
      throw new AppError("Diseño no encontrado", 404);
    }

    res.status(200).json(disenno);
  } catch (error) {
    next(error);
  }
});

// Actualizar un diseño
router.put("/:id", uploadDisenio.single("imagen"), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { manicureidusuario } = req.body;

    if (isNaN(id)) {
      throw new AppError("ID inválido", 400);
    }

    // Si se subió una nueva imagen, usar su ruta (sin 'uploads')
    const url = req.file ? `disenios/${req.file.filename}` : undefined;

    const disenno = await actualizarDisenno(id, url, manicureidusuario);

    res.status(200).json({
      message: "Diseño actualizado exitosamente",
      disenno,
    });
  } catch (error: any) {
    // Si hay error y se subió un archivo, eliminarlo
    if (req.file) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../", req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
});

// Eliminar un diseño
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new AppError("ID inválido", 400);
    }

    const result = await eliminarDisenno(id);

    if (result === 0) {
      throw new AppError("Diseño no encontrado", 404);
    }

    res.status(200).json({ message: "Diseño eliminado exitosamente" });
  } catch (error) {
    next(error);
  }
});

export default router;
