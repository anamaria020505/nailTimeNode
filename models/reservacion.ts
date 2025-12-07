import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface ReservacionAtributos {
  id: number;
  disenno?: string;
  tamanno?: string;
  precio: number;
  fecha: Date;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada";
  horarioid: number;
  clienteidusuario: string;
  servicioid: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReservacionCreationAttributes
  extends Optional<
    ReservacionAtributos,
    "id" | "disenno" | "tamanno" | "createdAt" | "updatedAt"
  > { }

class Reservacion
  extends Model<ReservacionAtributos, ReservacionCreationAttributes>
  implements ReservacionAtributos {
  public id!: number;
  public disenno?: string;
  public tamanno?: string;
  public precio!: number;
  public fecha!: Date;
  public estado!: "pendiente" | "confirmada" | "completada" | "cancelada";
  public horarioid!: number;
  public clienteidusuario!: string;
  public servicioid!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Reservacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    disenno: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tamanno: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "confirmada",
        "completada",
        "cancelada"
      ),
      allowNull: false,
    },
    horarioid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "horario",
        key: "id",
      },
    },
    clienteidusuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: "cliente",
        key: "idusuario",
      },
    },
    servicioid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "servicio",
        key: "id",
      },
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
    tableName: "reservacion",
    sequelize: database,
  }
);

export default Reservacion;
