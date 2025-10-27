import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import sequelize, { testConnection } from "../config/database";
import "../models";

import usuarioRoutes from "../routes/usuario";
import servicioRoutes from "../routes/servicio";
import horarioRoutes from "../routes/horario";
import reservacionRoutes from "../routes/reservacion";
import notificacionRoutes from "../routes/notificacion";
import disennoRoutes from "../routes/disenno";

const errorHandler = require("../middlewares/errorHandler.js");

dotenv.config();

const app = express();

// Initialize database connection
testConnection();

// middlewares
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes

app.use("/usuarios", usuarioRoutes);
app.use("/servicios", servicioRoutes);
app.use("/horario", horarioRoutes);
app.use("/reservacion", reservacionRoutes);
app.use("/notificacion", notificacionRoutes);
app.use("/disenios", disennoRoutes);

app.use(errorHandler);

export default app;

// Database connection function
async function connectDB() {
  try {
    // Sincronizar modelos (en desarrollo)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false, alter: true });
      console.log("✅ Modelos sincronizados con la base de datos");
    }
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
    process.exit(1);
  }
}

export { app, connectDB };
