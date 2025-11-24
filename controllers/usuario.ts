import Usuario from "../models/usuario";
import Cliente from "../models/cliente";
import Manicure from "../models/manicure";
import { deleteFile } from "../config/multer";
import path from "path";
import jwt from "jsonwebtoken";
const AppError = require("../errors/AppError");
const { comparePassword } = require("../utils/hashPass");
const { addToBlacklist } = require("../utils/tokenBlacklist");

export const obtenerUsuariosPaginated = async (
  page: number,
  limit: number
): Promise<any> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Usuario.findAndCountAll({
    attributes: { exclude: ["contrasena"] },
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Manicure, as: "manicure", required: false },
    ],
    order: [["nombre", "ASC"]],
    limit: limit,
    offset: offset,
  });

  return {
    count,
    rows,
  };
};

export const obtenerUsuarios = async (): Promise<any> => {
  const { count, rows } = await Usuario.findAndCountAll({
    attributes: { exclude: ["contrasena"] },
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Manicure, as: "manicure", required: false },
    ],
    order: [["nombre", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerUsuarioPorUsuario = async (usuario: string) => {
  const user = await Usuario.findByPk(usuario, {
    attributes: { exclude: ["contrasena"] },
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Manicure, as: "manicure", required: false },
    ],
  });

  return user;
};

export const crearUsuario = async (
  usuario: string,
  nombre: string,
  contrasena: string,
  rol: string,
  cliente?: {
    telefono: string;
  },
  manicure?: {
    foto?: string;
    direccion: string;
    provincia: string;
    municipio: string;
    telefono: string;
  }
) => {

  console.log(usuario)
  console.log(rol)
  console.log(manicure)

  // Create the user first
  const user = await Usuario.create({
    usuario,
    nombre,
    contrasena, // Hash the password
    rol,
  });

  // Handle different roles
  if (rol === "cliente" && cliente) {
    await Cliente.create({
      idusuario: usuario,
      telefono: cliente.telefono,
    });
  } else if (rol === "manicure" && manicure) {
    await Manicure.create({
      idusuario: usuario,
      foto: manicure.foto,
      direccion: manicure.direccion,
      provincia: manicure.provincia,
      municipio: manicure.municipio,
      telefono: manicure.telefono,
    });
  } else if (rol !== "admin") {
    throw new Error("Rol inválido o faltan campos requeridos");
  }

  return user;
};

export const actualizarUsuario = async (
  usuarioU: string,
  usuario: string,
  nombre: string,
  contrasena: string | null,
  rol: string,
  cliente?: {
    telefono: string;
  },
  manicure?: {
    foto?: string;
    direccion: string;
    provincia: string;
    municipio: string;
    telefono: string;
  }
) => {
  // Crear objeto con los datos a actualizar
  const updateData: any = {
    usuario,
    nombre,
    rol,
  };

  const rolAnterior = (await obtenerUsuarioPorUsuario(usuarioU))?.rol;

  // Agregar contraseña solo si se proporciona
  if (contrasena !== null) {
    updateData.contrasena = contrasena; // Deberías hashear la contraseña aquí
  }

  // Actualizar el usuario usando el método update de Sequelize
  const [updated] = await Usuario.update(updateData, {
    where: { usuario: usuarioU },
    returning: true,
  });

  if (updated === 0) {
    throw new AppError("Usuario no encontrado");
  }

  // Si el rol cambió, limpiar datos del rol anterior
  if (rolAnterior !== rol) {
    if (rolAnterior === "cliente") {
      await Cliente.destroy({ where: { idusuario: usuarioU } });
    } else if (rolAnterior === "manicure") {
      // Eliminar foto si existe antes de eliminar el registro
      const manicureAnterior = await Manicure.findByPk(usuarioU);
      if (manicureAnterior?.foto) {
        const filePath = path.join(__dirname, "../uploads", manicureAnterior.foto);
        deleteFile(filePath);
      }
      await Manicure.destroy({ where: { idusuario: usuarioU } });
    }
  }

  // Manejar la creación/actualización según el nuevo rol
  if (rol === "cliente" && cliente) {
    await Cliente.upsert(
      {
        idusuario: usuario,
        telefono: cliente.telefono,
      },
      {
        conflictFields: ["idusuario"],
      }
    );
  } else if (rol === "manicure" && manicure) {
    // Si se proporciona una nueva foto, eliminar la anterior
    if (manicure.foto) {
      const manicureExistente = await Manicure.findByPk(usuarioU);
      if (manicureExistente?.foto && manicureExistente.foto !== manicure.foto) {
        const oldFilePath = path.join(__dirname, "../uploads", manicureExistente.foto);
        deleteFile(oldFilePath);
      }
    }

    await Manicure.upsert(
      {
        idusuario: usuario,
        foto: manicure.foto,
        direccion: manicure.direccion,
        provincia: manicure.provincia,
        municipio: manicure.municipio,
        telefono: manicure.telefono,
      },
      {
        conflictFields: ["idusuario"],
      }
    );
  }
};

export const logout = (token: string) => {
  // Add the token to the blacklist
  addToBlacklist(token);
  return { message: "Sesión cerrada exitosamente" };
};

export const login = async (usuario: string, contrasena: string) => {
  const user = await Usuario.findByPk(usuario, {
    include: [
      { model: Cliente, as: "cliente", required: false },
      { model: Manicure, as: "manicure", required: false },
    ],
  });

  if (!user) {
    throw new AppError("Usuario o contraseña incorrectos", 401);
  }

  const isMatch = await comparePassword(contrasena, user.contrasena);
  
  if (!isMatch) {
    throw new AppError("Usuario o contraseña incorrectos", 401);
  }

  // Create token
  const token = jwt.sign(
    { 
      usuario: user.usuario, 
      role: user.rol 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  // Remove password from user object
  const userWithoutPassword = user.get({ plain: true }) as any; // Using type assertion here
  delete userWithoutPassword.contrasena;

  return {
    user: userWithoutPassword,
    token
  };
};

export const eliminarUsuario = async (usuario: string) => {
  // Verificar si es manicure y tiene foto para eliminarla
  const user = await Usuario.findByPk(usuario, {
    include: [{ model: Manicure, as: "manicure", required: false }],
  });

  if (user) {
    const manicure = await Manicure.findByPk(usuario);
    if (manicure?.foto) {
      const filePath = path.join(__dirname, "../uploads", manicure.foto);
      deleteFile(filePath);
    }
  }

  const result = await Usuario.destroy({ where: { usuario } });
  return result;
};
