import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface UsuarioAtributos{
  usuario: string;
  nombre: string;
  contrasena: string;
  rol: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UsuarioCreationAttributes extends Optional<UsuarioAtributos, 'createdAt' | 'updatedAt'> {}

class Usuario extends Model<UsuarioAtributos, UsuarioCreationAttributes> implements UsuarioAtributos {
  public usuario!: string;
  public nombre!: string;
  public contrasena!: string;
  public rol!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Usuario.init(
  {
    usuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: 'usuario',
    sequelize: database,
  }
);

export default Usuario;