import Disenno from "../models/disenno";
import Manicure from "../models/manicure";
import Usuario from "../models/usuario";
import { deleteFile } from "../config/multer";
import path from "path";
const AppError = require("../errors/AppError");

// Obtener todos los diseños con paginación
export const obtenerDisennosPaginated = async (
  page: number,
  limit: number
): Promise<any> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Disenno.findAndCountAll({
    include: [{
      model: Manicure,
      as: "manicure",
      include: [{ model: Usuario, as: "usuario", attributes: ["nombre"] }]
    }],
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
  });

  return {
    count,
    rows,
  };
};

// Obtener todos los diseños
export const obtenerDisennos = async (): Promise<any> => {
  const { count, rows } = await Disenno.findAndCountAll({
    include: [{
      model: Manicure,
      as: "manicure",
      include: [{ model: Usuario, as: "usuario", attributes: ["nombre"] }]
    }],
    order: [["createdAt", "DESC"]],
  });

  return {
    count,
    rows,
  };
};

// Obtener diseños por manicure
export const obtenerDisennosPorManicure = async (
  manicureidusuario: string
): Promise<any> => {
  const { count, rows } = await Disenno.findAndCountAll({
    where: { manicureidusuario },
    include: [{
      model: Manicure,
      as: "manicure",
      include: [{ model: Usuario, as: "usuario", attributes: ["nombre"] }]
    }],
    order: [["createdAt", "DESC"]],
  });

  return {
    count,
    rows,
  };
};

// Obtener un diseño por ID
export const obtenerDisennoPorId = async (id: number) => {
  const disenno = await Disenno.findByPk(id, {
    include: [{
      model: Manicure,
      as: "manicure",
      include: [{ model: Usuario, as: "usuario", attributes: ["nombre"] }]
    }]
  });
  return disenno;
};

// Crear un nuevo diseño
export const crearDisenno = async (
  url: string,
  manicureidusuario: string
) => {
  const disenno = await Disenno.create({
    url,
    manicureidusuario,
  });

  return disenno;
};

// Actualizar un diseño
export const actualizarDisenno = async (
  id: number,
  url?: string,
  manicureidusuario?: string
) => {
  // Buscar el diseño existente
  const disennoExistente = await Disenno.findByPk(id);

  if (!disennoExistente) {
    throw new AppError("Diseño no encontrado", 404);
  }

  // Si se proporciona una nueva URL (nueva imagen), eliminar la anterior
  if (url && disennoExistente.url !== url) {
    const oldFilePath = path.join(__dirname, "../uploads", disennoExistente.url);
    deleteFile(oldFilePath);
  }

  // Crear objeto con los datos a actualizar
  const updateData: any = {};

  if (url) updateData.url = url;
  if (manicureidusuario) updateData.manicureidusuario = manicureidusuario;

  // Actualizar el diseño
  const [updated] = await Disenno.update(updateData, {
    where: { id },
    returning: true,
  });

  if (updated === 0) {
    throw new AppError("No se pudo actualizar el diseño", 500);
  }

  // Obtener el diseño actualizado
  const disennoActualizado = await Disenno.findByPk(id);
  return disennoActualizado;
};

// Eliminar un diseño
export const eliminarDisenno = async (id: number) => {
  // Buscar el diseño para obtener la URL de la imagen
  const disenno = await Disenno.findByPk(id);

  if (!disenno) {
    throw new AppError("Diseño no encontrado", 404);
  }

  // Eliminar el archivo de imagen
  const filePath = path.join(__dirname, "../uploads", disenno.url);
  deleteFile(filePath);

  // Eliminar el registro de la base de datos
  const result = await Disenno.destroy({ where: { id } });

  return result;
};
