import Usuario from "../models/usuario";
import Cliente from "../models/cliente";
import Manicure from "../models/manicure";
import Reservacion from "../models/reservacion";
import Servicio from "../models/servicio";
import Notificacion from "../models/notificacion";
import ClienteManicure from "../models/clienteManicure";
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

export const obtenerManicures = async (): Promise<any> => {
  const { count, rows } = await Usuario.findAndCountAll({
    where: { rol: "manicure" },
    attributes: { exclude: ["contrasena"] },
    include: [
      { model: Manicure, as: "manicure", required: true },
    ],
    order: [["nombre", "ASC"]],
  });

  return {
    count,
    rows,
  };
};

export const obtenerClientes = async (): Promise<any> => {
  const { count, rows } = await Usuario.findAndCountAll({
    where: { rol: "cliente" },
    attributes: { exclude: ["contrasena"] },
    include: [
      { model: Cliente, as: "cliente" },
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
    usuario: usuario.trim(),
    nombre,
    contrasena, // Hash the password
    rol,
  });

  // Handle different roles
  if (rol === "cliente") {
    await Cliente.create({
      idusuario: usuario.trim(),
      telefono: cliente?.telefono || null,
    });
  } else if (rol === "manicure") {
    if (!manicure) {
      throw new Error("Faltan campos requeridos para el rol manicure");
    }
    await Manicure.create({
      idusuario: usuario,
      foto: manicure.foto,
      direccion: manicure.direccion,
      provincia: manicure.provincia,
      municipio: manicure.municipio,
      telefono: manicure.telefono,
    });
  } else if (rol !== "admin") {
    throw new Error("Rol inválido");
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
    usuario: usuario.trim(),
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
  if (rol === "cliente") {
    await Cliente.upsert(
      {
        idusuario: usuario.trim(),
        telefono: cliente?.telefono || null,
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

export const actualizarPerfil = async (
  usuarioId: string,
  data: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    provincia?: string;
    municipio?: string;
  }
) => {
  const user = await Usuario.findByPk(usuarioId);
  if (!user) throw new AppError("Usuario no encontrado", 404);

  // Update common fields
  if (data.nombre) {
    await user.update({ nombre: data.nombre });
  }

  // Update role-specific fields
  if (user.rol === "cliente") {
    await Cliente.upsert(
      { idusuario: usuarioId, telefono: data.telefono || null },
      { conflictFields: ["idusuario"] }
    );
  } else if (user.rol === "manicure") {
    const updateManicureData: any = {};
    if (data.direccion) updateManicureData.direccion = data.direccion;
    if (data.provincia) updateManicureData.provincia = data.provincia;
    if (data.municipio) updateManicureData.municipio = data.municipio;
    if (data.telefono) updateManicureData.telefono = data.telefono;

    if (Object.keys(updateManicureData).length > 0) {
      await Manicure.update(updateManicureData, {
        where: { idusuario: usuarioId },
      });
    }
  }

  return await obtenerUsuarioPorUsuario(usuarioId);
};


export const logout = (token: string) => {
  // Add the token to the blacklist
  addToBlacklist(token);
  return { message: "Sesión cerrada exitosamente" };
};

export const login = async (usuario: string, contrasena: string) => {
  const user = await Usuario.findByPk(usuario.trim(), {
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
  const userTrimmed = usuario.trim();
  
  // 1. Encontrar el usuario para obtener datos antes de borrar (ej: foto de manicure)
  let user = await Usuario.findByPk(usuario, {
    include: [{ model: Manicure, as: "manicure", required: false }],
  });

  if (!user && usuario !== userTrimmed) {
    user = await Usuario.findByPk(userTrimmed, {
      include: [{ model: Manicure, as: "manicure", required: false }],
    });
    if (user) usuario = userTrimmed;
  }

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  // 2. Si es manicure, eliminar su foto física antes del cascade
  if (user.rol === "manicure" && (user as any).manicure?.foto) {
    const filePath = path.join(__dirname, "../uploads", (user as any).manicure.foto);
    deleteFile(filePath);
  }

  // 3. Eliminación física total vía CASCADE definido en los modelos
  const result = await Usuario.destroy({ where: { usuario: usuario } });
  
  return result;
};
