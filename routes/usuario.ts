import { Router } from "express";
import {
  obtenerUsuariosPaginated,
  obtenerUsuarioPorUsuario,
  crearUsuario,
  obtenerUsuarios,
  eliminarUsuario,
  actualizarUsuario,
} from "../controllers/usuario";
const AppError = require("../errors/AppError");
const { hashPassword } = require("../utils/hashPass");

const router = Router();

// Rutas públicas (autenticación)

// Rutas CRUD para usuarios (protegidas)

router.post("/", async (req, res, next) => {
  try {
    const { usuario, nombre, contrasena, rol } = req.body;
    const cliente: { telefono: string } = req.body.cliente;
    const manicure: {
      direccion: string;
      provincia: string;
      municipio: string;
      telefono: string;
    } = req.body.manicure;

    if (!usuario || !nombre || !contrasena || !rol) {
      throw new AppError(
        "Usuario nombre, contraseña y rol son requeridos",
        400
      );
    }

    const hashedPassword = await hashPassword(contrasena);

    let user = await crearUsuario(
      usuario,
      nombre,
      hashedPassword,
      rol,
      cliente,
      manicure
    );

    res.status(201).json(user);
  } catch (error: any) {
    if (
      error.parent?.detail?.includes("usuario") &&
      error.parent?.code === "23505"
    ) {
      return next(new AppError("El usuario ya existe", 400));
    }

    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const user = await obtenerUsuarios();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/:usuario", async (req, res, next) => {
  try {
    const { usuario } = req.params;
    const user = await obtenerUsuarioPorUsuario(usuario);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/:page/:limit", async (req, res, next) => {
  try {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);

    if (page < 1 || limit < 1) {
      throw new AppError("Parámetros de paginación inválidos", 400);
    }

    const users = await obtenerUsuariosPaginated(page, limit);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

router.put("/:usuarioU", async (req, res, next) => {
  try {
    const { usuarioU } = req.params;
    const { usuario, nombre, contrasena, rol } = req.body;
    const cliente: { telefono: string } = req.body.cliente;
    const manicure: {
      direccion: string;
      provincia: string;
      municipio: string;
      telefono: string;
    } = req.body.manicure;

    if (!usuarioU) {
      return res
        .status(400)
        .json({ message: "Usuario a actualizar es requerido" });
    }

    if (!usuario || !nombre || !rol) {
      throw new AppError("Usuario,nombre y rol son requeridos", 400);
    }

    const hashedPassword = contrasena
      ? await hashPassword(contrasena)
      : undefined;
    let user = await actualizarUsuario(
      usuarioU,
      usuario,
      nombre,
      hashedPassword,
      rol,
      cliente,
      manicure
    );
    res.status(200).json({ message: "Usuario actualizado" });
  } catch (error: any) {
    console.log(error);
    if (
      error.parent?.detail?.includes("usuario") &&
      error.parent?.code === "23505"
    ) {
      return next(new AppError("El usuario ya existe", 400));
    }
    next(error);
  }
});

router.delete("/:usuario", async (req, res, next) => {
  try {
    const { usuario } = req.params;
    if (!usuario) {
      throw new AppError("usuario es requerido", 400);
    }

    const result = await eliminarUsuario(usuario);

    if (result == 0) {
      throw new AppError("Usuario no encontrado", 404);
    }

    res.status(200).json({ message: "Usuario eliminado" });
  } catch (error) {
    next(error);
  }
});

export default router;
