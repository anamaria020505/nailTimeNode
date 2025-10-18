import Usuario from "../models/usuario";
import Cliente from "../models/cliente";
import Manicure from "../models/manicure";
const AppError = require("../errors/AppError");

// Obtener todos los usuarios
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
    attributes: { exclude: ["password"] },
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
    direccion: string;
    provincia: string;
    municipio: string;
    telefono: string;
  }
) => {
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
    await Manicure.upsert(
      {
        idusuario: usuario,
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

export const eliminarUsuario = async (usuario: string) => {
  const user = await Usuario.destroy({ where: { usuario } });
  return user;
};
