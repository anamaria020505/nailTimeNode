import multer from "multer";
import path from "path";
import fs from "fs";

// Crear directorios si no existen
const uploadDir = path.join(__dirname, "../uploads");
const disennosDir = path.join(uploadDir, "disenios");
const manicuresDir = path.join(uploadDir, "manicures");

[uploadDir, disennosDir, manicuresDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de almacenamiento para diseños
const disennoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, disennosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `disenio-${uniqueSuffix}${ext}`);
  },
});

// Configuración de almacenamiento para manicures
const manicureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, manicuresDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `manicure-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos - solo imágenes
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)"));
  }
};

// Límites de tamaño
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

// Exportar configuraciones de multer
export const uploadDisenio = multer({
  storage: disennoStorage,
  fileFilter: fileFilter,
  limits: limits,
});

export const uploadManicure = multer({
  storage: manicureStorage,
  fileFilter: fileFilter,
  limits: limits,
});

// Función auxiliar para eliminar archivos
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Función para obtener la ruta relativa de la imagen
export const getRelativePath = (fullPath: string): string => {
  return fullPath.replace(__dirname + "/../", "");
};
