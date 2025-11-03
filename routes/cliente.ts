import { Router } from "express";
import { 
  obtenerClientesOrdenadosPorReservaciones, 
  obtenerReservacionesCliente, 
  obtenerReservacionesClientePaginadas 
} from "../controllers/cliente";
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
      console.log(error)
      next(error);
    }
  }
);

// Obtener todas las reservaciones del cliente autenticado
router.get(
  "/mis-reservaciones",
  authenticate(["cliente"]),
  async (req: any, res, next) => {
    try {
      const clienteId = req.userData?.usuario;
      if (!clienteId) {
        throw new AppError("No se pudo identificar al cliente", 401);
      }

      const reservaciones = await obtenerReservacionesCliente(clienteId);
      res.json(reservaciones);
    } catch (error) {
      next(error);
    }
  }
);

// Obtener reservaciones del cliente autenticado con paginación
router.get(
  "/mis-reservaciones/paginado",
  authenticate(["cliente"]),
  async (req: any, res, next) => {
    try {
      const clienteId = req.userData?.usuario;
      if (!clienteId) {
        throw new AppError("No se pudo identificar al cliente", 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (page < 1 || pageSize < 1) {
        throw new AppError("Los parámetros de paginación deben ser mayores a 0", 400);
      }

      const resultado = await obtenerReservacionesClientePaginadas(
        clienteId,
        page,
        pageSize
      );
      
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }
);

export default router;