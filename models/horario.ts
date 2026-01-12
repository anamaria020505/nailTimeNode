import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface HorarioAtributos{
  id: number;
  horaInicio: string;
  horaFinal: string;
  manicureidusuario: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HorarioCreationAttributes extends Optional<HorarioAtributos, 'id' | 'createdAt' | 'updatedAt'> {}

class Horario extends Model<HorarioAtributos, HorarioCreationAttributes> implements HorarioAtributos {
  public id!: number;
  public horaInicio!: string;
  public horaFinal!: string;
  public manicureidusuario!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Horario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    horaInicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    horaFinal: {
      type: DataTypes.TIME,
      allowNull: false,
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
    tableName: 'horario',
    sequelize: database,
  }
);

export default Horario;
