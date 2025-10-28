import { Router } from "express";
import path from "path";
import fs from "fs";
const AppError = require("../errors/AppError");

const router = Router();

// Obtener imagen por URL
router.get("/", async (req, res, next) => {
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

export default router;
