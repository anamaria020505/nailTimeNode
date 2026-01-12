import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface DisennoAtributos{
  id: number;
  url: string;
  manicureidusuario: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DisennoCreationAttributes extends Optional<DisennoAtributos, 'id' | 'createdAt' | 'updatedAt'> {}

class Disenno extends Model<DisennoAtributos, DisennoCreationAttributes> implements DisennoAtributos {
  public id!: number;
  public url!: string;
  public manicureidusuario!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Disenno.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING(255),
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
    tableName: 'disenno',
    sequelize: database,
  }
);

export default Disenno;
