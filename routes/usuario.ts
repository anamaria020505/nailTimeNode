import { Router } from "express";
import {
  obtenerUsuariosPaginated,
  obtenerUsuarioPorUsuario,
  crearUsuario,
  obtenerUsuarios,
  eliminarUsuario,
  actualizarUsuario,
  login,
  logout,
  obtenerManicures,
} from "../controllers/usuario";
import { uploadManicure } from "../config/multer";
const AppError = require("../errors/AppError");
const { hashPassword } = require("../utils/hashPass");
const authenticate = require("../middlewares/autenticarse");

const router = Router();

// Rutas públicas (autenticación)
router.post("/login", async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      throw new AppError("Usuario y contraseña son requeridos", 400);
    }

    const result = await login(usuario, contrasena);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Registro público de clientes
router.post("/register", async (req, res, next) => {
  try {
    const { usuario, nombre, contrasena, cliente } = req.body;

    if (!usuario || !nombre || !contrasena) {
      throw new AppError("Usuario, nombre y contraseña son requeridos", 400);
    }

    const hashedPassword = await hashPassword(contrasena);

    const telefono = cliente?.telefono || req.body.telefono;
    const newUser = await crearUsuario(
      usuario,
      nombre,
      hashedPassword,
      "cliente",
      telefono ? { telefono } : undefined,
      undefined
    );

    res.status(201).json(newUser);
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

// Ruta para cerrar sesión
router.post("/logout", authenticate(["admin", "cliente", "manicure"]), (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError("No hay token de autenticación", 401);
    }
    const token = authHeader.split(" ")[1];
    const result = logout(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Obtener datos del usuario autenticado
router.get(
  "/me",
  authenticate(["admin", "cliente", "manicure"]),
  async (req, res, next) => {
    try {
      const usuario = (req as any).userData?.usuario;
      if (!usuario) {
        throw new AppError("No se pudo determinar el usuario autenticado", 401);
      }

      const user = await obtenerUsuarioPorUsuario(usuario);
      if (!user) {
        throw new AppError("Usuario no encontrado", 404);
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", authenticate(["admin"]), uploadManicure.single("foto"), async (req, res, next) => {
  try {
    const { usuario, nombre, contrasena, rol } = req.body;
    const cliente: { telefono: string } = req.body.cliente;
    const manicure: {
      foto?: string;
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

    // Si es manicure y se subió una foto, agregar la ruta
    if (rol === "manicure" && req.file && manicure) {
      manicure.foto = `manicures/${req.file.filename}`;
    }

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
    // Si hay error y se subió un archivo, eliminarlo
    if (req.file) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../", req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (
      error.parent?.detail?.includes("usuario") &&
      error.parent?.code === "23505"
    ) {
      return next(new AppError("El usuario ya existe", 400));
    }

    next(error);
  }
});

router.get("/manicures", authenticate(["admin", "cliente", "manicure"]), async (req, res, next) => {
  try {
    const users = await obtenerManicures();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate(["admin"]), async (req, res, next) => {
  try {
    const user = await obtenerUsuarios();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/:usuario", authenticate(["admin"]), async (req, res, next) => {
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

router.get("/:page/:limit", authenticate(["admin"]), async (req, res, next) => {
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

router.put(
  "/:usuarioU", authenticate(["admin"]),
  uploadManicure.single("foto"),
  async (req, res, next) => {
    try {
      const { usuarioU } = req.params;
      const { usuario, nombre, contrasena, rol } = req.body;
      const cliente: { telefono: string } = req.body.cliente;
      const manicure: {
        foto?: string;
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

      // Si es manicure y se subió una foto, agregar la ruta
      if (rol === "manicure" && req.file && manicure) {
        manicure.foto = `manicures/${req.file.filename}`;
      }

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

      // Si hay error y se subió un archivo, eliminarlo
      if (req.file) {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(__dirname, "../", req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      if (
        error.parent?.detail?.includes("usuario") &&
        error.parent?.code === "23505"
      ) {
        return next(new AppError("El usuario ya existe", 400));
      }
      next(error);
    }
  }
);

router.delete("/:usuario", authenticate(["admin"]), async (req, res, next) => {
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
