import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface NotificacionAtributos{
  id: number;
  mensaje: string;
  reservacionid: number;
  leido: boolean;
  manicureidusuario: string;
  clienteidusuario: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificacionCreationAttributes extends Optional<NotificacionAtributos, 'id' | 'leido' | 'createdAt' | 'updatedAt'> {}

class Notificacion extends Model<NotificacionAtributos, NotificacionCreationAttributes> implements NotificacionAtributos {
  public id!: number;
  public mensaje!: string;
  public reservacionid!: number;
  public leido!: boolean;
  public manicureidusuario!: string;
  public clienteidusuario!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notificacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    mensaje: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    reservacionid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reservacion',
        key: 'id'
      }
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    manicureidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'manicure',
        key: 'idusuario'
      }
    },
    clienteidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: 'notificacion',
    sequelize: database,
  }
);

export default Notificacion;
