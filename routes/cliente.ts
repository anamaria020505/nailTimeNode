import { Router } from "express";
import { obtenerClientesOrdenadosPorReservaciones } from "../controllers/cliente";
const AppError = require("../errors/AppError");
const authenticate = require("../middlewares/autenticarse");

const router = Router();

// Obtener listado de clientes ordenado por cantidad de reservaciones
// Solo muestra reservaciones de la manicure autenticada
router.get(
  "/ordenados-por-reservaciones",
  authenticate(["manicure"]),
  async (req: any, res, next) => {
    try {
      const manicureidusuario = req.userData?.usuario;

      if (!manicureidusuario) {
        throw new AppError("No se pudo identificar la manicure", 401);
      }

      const clientes =
        await obtenerClientesOrdenadosPorReservaciones(manicureidusuario);

      res.status(200).json(clientes);
    } catch (error) {
      next(error);
    }
  }
);

export default router;