import { Router } from "express";
import {
  obtenerEstadisticasPorUbicacion,
  obtenerEstadisticasPorProvincia,
  obtenerEstadisticasPorMunicipio,
} from "../controllers/manicure";
const AppError = require("../errors/AppError");
const authenticate = require("../middlewares/autenticarse");

const router = Router();

// Obtener estadísticas de manicuristas por ubicación (provincia y municipio)
router.get(
  "/manicuristas/ubicacion",
  authenticate(["admin"]),
  async (req, res, next) => {
    try {
      const estadisticas = await obtenerEstadisticasPorUbicacion();
      res.status(200).json({
        estadisticas
      });
    } catch (error) {
      console.error('Error en obtenerEstadisticasPorUbicacion:', error);
      next(new AppError('Error al obtener las estadísticas de ubicación', 500));
    }
  }
);

// Obtener estadísticas de manicuristas por provincia
router.get(
  "/manicuristas/provincias",
  authenticate(["admin"]),
  async (req, res, next) => {
    try {
      const estadisticas = await obtenerEstadisticasPorProvincia();
      res.status(200).json({
        estadisticas
      });
    } catch (error) {
      console.error('Error en obtenerEstadisticasPorProvincia:', error);
      next(new AppError('Error al obtener las estadísticas por provincia', 500));
    }
  }
);

// Obtener estadísticas de manicuristas por municipio de una provincia específica
router.get(
  "/manicuristas/provincia/:provincia/municipios",
  authenticate(["admin"]),
  async (req, res, next) => {
    try {
      const { provincia } = req.params;
      const estadisticas = await obtenerEstadisticasPorMunicipio(provincia);
      res.status(200).json({
        estadisticas
      });
    } catch (error) {
      console.error('Error en obtenerEstadisticasPorMunicipio:', error);
      next(new AppError('Error al obtener las estadísticas por municipio', 500));
    }
  }
);

export default router;
