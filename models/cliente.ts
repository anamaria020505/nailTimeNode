import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface ClienteAtributos {
  idusuario: string;
  telefono: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClienteCreationAttributes
  extends Optional<ClienteAtributos, "createdAt" | "updatedAt"> {}

class Cliente
  extends Model<ClienteAtributos, ClienteCreationAttributes>
  implements ClienteAtributos
{
  public idusuario!: string;
  public telefono!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cliente.init(
  {
    idusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: "usuario",
        key: "usuario",
      },
    },
    telefono: {
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
    tableName: "cliente",
    sequelize: database,
  }
);

export default Cliente;
