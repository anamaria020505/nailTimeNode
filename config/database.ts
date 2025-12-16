import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = require("../config/config");
const environment = process.env.NODE_ENV || "development";
const configEnv = config[environment];


// Database configuration
const sequelize = new Sequelize({
  dialect: configEnv.dialect, // or 'postgres', 'sqlite', 'mssql'
  host: configEnv.host,
  port: configEnv.port,
  database: configEnv.database,
  username: configEnv.username,
  password: configEnv.password,
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