import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface ServicioAtributos{
  id: number;
  nombre: string;
  disponible: boolean;
  manicureidusuario: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServicioCreationAttributes extends Optional<ServicioAtributos, 'id' | 'disponible' | 'createdAt' | 'updatedAt'> {}

class Servicio extends Model<ServicioAtributos, ServicioCreationAttributes> implements ServicioAtributos {
  public id!: number;
  public nombre!: string;
  public disponible!: boolean;
  public manicureidusuario!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Servicio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    manicureidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'manicure',
        key: 'idusuario'
      },
      onDelete: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'servicio',
    sequelize: database,
  }
);

export default Servicio;
