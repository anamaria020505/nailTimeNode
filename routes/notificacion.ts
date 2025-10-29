import { Router, Request, Response } from "express";
import * as notificacionController from "../controllers/notificacion";
const logger = require("../loggers/logger");
const authenticate = require("../middlewares/autenticarse");
const router = Router();

// Obtener todas las notificaciones de un usuario según su rol
// Query params: rol (cliente | manicure), soloNoLeidas (true | false)
router.get("/:idusuario", authenticate(["cliente","manicure"]),  async (req: Request, res: Response) => {
  try {
    const { idusuario } = req.params;
    const { rol, soloNoLeidas } = req.query;

    // Validar que el rol sea válido
    if (!rol || (rol !== "cliente" && rol !== "manicure")) {
      return res.status(400).json({
        success: false,
        message:
          "El parámetro 'rol' es requerido y debe ser 'cliente' o 'manicure'",
      });
    }

    const notificaciones = await notificacionController.obtenerNotificaciones(
      idusuario,
      rol as "cliente" | "manicure",
      soloNoLeidas === "true"
    );

    res.status(200).json({
      success: true,
      data: notificaciones,
    });
  } catch (error: any) {
    logger.error(`Error al obtener notificaciones: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error al obtener las notificaciones",
    });
  }
});

// Contar notificaciones no leídas de un usuario según su rol
// Query params: rol (cliente | manicure)
router.get("/:idusuario/count", authenticate(["cliente","manicure"]),  async (req: Request, res: Response) => {
  try {
    const { idusuario } = req.params;
    const { rol } = req.query;

    // Validar que el rol sea válido
    if (!rol || (rol !== "cliente" && rol !== "manicure")) {
      return res.status(400).json({
        success: false,
        message:
          "El parámetro 'rol' es requerido y debe ser 'cliente' o 'manicure'",
      });
    }

    const result = await notificacionController.contarNotificacionesNoLeidas(
      idusuario,
      rol as "cliente" | "manicure"
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Error al contar notificaciones no leídas: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error al contar las notificaciones no leídas",
    });
  }
});

// Marcar una notificación específica como leída
router.patch("/:id/leida", authenticate(["cliente","manicure"]),  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notificacion =
      await notificacionController.marcarNotificacionComoLeida(Number(id));

    res.status(200).json({
      success: true,
      message: "Notificación marcada como leída",
      data: notificacion,
    });
  } catch (error: any) {
    logger.error(`Error al marcar notificación como leída: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error al marcar la notificación como leída",
    });
  }
});

// Marcar todas las notificaciones de un usuario como leídas
// Query params: rol (cliente | manicure)
router.patch(
  "/:idusuario/marcar-todas-leidas",
  authenticate(["cliente","manicure"]),  async (req: Request, res: Response) => {
    try {
      const { idusuario } = req.params;
      const { rol } = req.query;

      // Validar que el rol sea válido
      if (!rol || (rol !== "cliente" && rol !== "manicure")) {
        return res.status(400).json({
          success: false,
          message:
            "El parámetro 'rol' es requerido y debe ser 'cliente' o 'manicure'",
        });
      }

      const result = await notificacionController.marcarTodasLeidas(
        idusuario,
        rol as "cliente" | "manicure"
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        `Error al marcar todas las notificaciones como leídas: ${error.message}`
      );
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Error al marcar todas las notificaciones como leídas",
      });
    }
  }
);

// Eliminar una notificación
router.delete("/:id", authenticate(["cliente","manicure"]),  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await notificacionController.eliminarNotificacion(
      Number(id)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Error al eliminar notificación: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error al eliminar la notificación",
    });
  }
});

export default router;
