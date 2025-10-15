import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface ClienteManicureAtributos{
  manicureidusuario: string;
  clienteidusuario: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClienteManicureCreationAttributes extends Optional<ClienteManicureAtributos, 'createdAt' | 'updatedAt'> {}

class ClienteManicure extends Model<ClienteManicureAtributos, ClienteManicureCreationAttributes> implements ClienteManicureAtributos {
  public manicureidusuario!: string;
  public clienteidusuario!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClienteManicure.init(
  {
    manicureidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'manicure',
        key: 'idusuario'
      }
    },
    clienteidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'cliente',
        key: 'idusuario'
      }
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
    tableName: 'cliente_manicure',
    sequelize: database,
  }
);

export default ClienteManicure;
