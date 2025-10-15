import database from "../config/database";
import Usuario from "./usuario";
import Cliente from "./cliente";
import Manicure from "./manicure";
import Servicio from "./servicio";
import Horario from "./horario";
import Disenno from "./disenno";
import Reservacion from "./reservacion";
import Notificacion from "./notificacion";
import ClienteManicure from "./clienteManicure";

// Initialize all models
Usuario.init(Usuario.getAttributes(), {
  tableName: 'usuario',
  sequelize: database,
});

Cliente.init(Cliente.getAttributes(), {
  tableName: 'cliente',
  sequelize: database,
});

Manicure.init(Manicure.getAttributes(), {
  tableName: 'manicure',
  sequelize: database,
});

Servicio.init(Servicio.getAttributes(), {
  tableName: 'servicio',
  sequelize: database,
});

Horario.init(Horario.getAttributes(), {
  tableName: 'horario',
  sequelize: database,
});

Disenno.init(Disenno.getAttributes(), {
  tableName: 'disenno',
  sequelize: database,
});

Reservacion.init(Reservacion.getAttributes(), {
  tableName: 'reservacion',
  sequelize: database,
});

Notificacion.init(Notificacion.getAttributes(), {
  tableName: 'notificacion',
  sequelize: database,
});

ClienteManicure.init(ClienteManicure.getAttributes(), {
  tableName: 'cliente_manicure',
  sequelize: database,
});

// Define associations
// Usuario associations
Usuario.hasOne(Cliente, {
  foreignKey: 'idusuario',
  as: 'cliente'
});

Usuario.hasOne(Manicure, {
  foreignKey: 'idusuario',
  as: 'manicure'
});

Cliente.belongsTo(Usuario, {
  foreignKey: 'idusuario',
  as: 'usuario'
});

Manicure.belongsTo(Usuario, {
  foreignKey: 'idusuario',
  as: 'usuario'
});

// Cliente-Manicure many-to-many relationship
Cliente.belongsToMany(Manicure, {
  through: ClienteManicure,
  foreignKey: 'clienteidusuario',
  otherKey: 'manicureidusuario',
  as: 'manicuristas'
});

Manicure.belongsToMany(Cliente, {
  through: ClienteManicure,
  foreignKey: 'manicureidusuario',
  otherKey: 'clienteidusuario',
  as: 'clientes'
});

// Manicure associations
Manicure.hasMany(Servicio, {
  foreignKey: 'manicureidusuario',
  as: 'servicios'
});

Manicure.hasMany(Horario, {
  foreignKey: 'manicureidusuario',
  as: 'horarios'
});

Manicure.hasMany(Disenno, {
  foreignKey: 'manicureidusuario',
  as: 'disennos'
});

Servicio.belongsTo(Manicure, {
  foreignKey: 'manicureidusuario',
  as: 'manicure'
});

Horario.belongsTo(Manicure, {
  foreignKey: 'manicureidusuario',
  as: 'manicure'
});

Disenno.belongsTo(Manicure, {
  foreignKey: 'manicureidusuario',
  as: 'manicure'
});

// Reservacion associations
Cliente.hasMany(Reservacion, {
  foreignKey: 'clienteidusuario',
  as: 'reservaciones'
});

Servicio.hasMany(Reservacion, {
  foreignKey: 'servicioid',
  as: 'reservaciones'
});

Horario.hasMany(Reservacion, {
  foreignKey: 'horarioid',
  as: 'reservaciones'
});

Reservacion.belongsTo(Cliente, {
  foreignKey: 'clienteidusuario',
  as: 'cliente'
});

Reservacion.belongsTo(Servicio, {
  foreignKey: 'servicioid',
  as: 'servicio'
});

Reservacion.belongsTo(Horario, {
  foreignKey: 'horarioid',
  as: 'horario'
});

// Notificacion associations
Manicure.hasMany(Notificacion, {
  foreignKey: 'manicureidusuario',
  as: 'notificacionesEnviadas'
});

Cliente.hasMany(Notificacion, {
  foreignKey: 'clienteidusuario',
  as: 'notificacionesRecibidas'
});

Reservacion.hasMany(Notificacion, {
  foreignKey: 'reservacionid',
  as: 'notificaciones'
});

Notificacion.belongsTo(Manicure, {
  foreignKey: 'manicureidusuario',
  as: 'manicure'
});

Notificacion.belongsTo(Cliente, {
  foreignKey: 'clienteidusuario',
  as: 'cliente'
});

Notificacion.belongsTo(Reservacion, {
  foreignKey: 'reservacionid',
  as: 'reservacion'
});

const modelos = {
  Usuario,
  Cliente,
  Manicure,
  Servicio,
  Horario,
  Disenno,
  Reservacion,
  Notificacion,
  ClienteManicure,
  database
};

export default modelos;