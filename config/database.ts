import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres', // or 'postgres', 'sqlite', 'mssql'
  host: process.env.DB_HOST|| 'localhost',
  port:  parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'nailTimeNode',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default sequelize;