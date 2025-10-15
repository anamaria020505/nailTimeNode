import * as express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';
import sequelize, { testConnection } from '../config/database';
import '../models';
import clienteRoutes from '../routes/cliente';
import clienteManicureRoutes from '../routes/clienteManicure';
import disennoRoutes from '../routes/disenno';
import horarioRoutes from '../routes/horario';
import manicureRoutes from '../routes/manicure';
import servicioRoutes from '../routes/servicio';
import notificacionRoutes from '../routes/notificacion';
import reservacionRoutes from '../routes/reservacion';
import usuarioRoutes from '../routes/usuario';
dotenv.config();

const app = express();

// Initialize database connection
testConnection();

// middlewares
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/clientes', clienteRoutes);
app.use('/api/clientes-manicures', clienteManicureRoutes);
app.use('/api/disennos', disennoRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/manicures', manicureRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/reservaciones', reservacionRoutes);
app.use('/api/usuarios', usuarioRoutes);

export default app;

// Database connection function
async function connectDB() {
  try {
    // Sincronizar modelos (en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false, alter: true});
      console.log('✅ Modelos sincronizados con la base de datos');

    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
}

export { app, connectDB };