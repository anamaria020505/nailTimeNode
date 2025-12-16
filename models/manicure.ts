import { DataTypes, Model, Optional } from "sequelize";
import database from "../config/database";

interface ManicureAtributos {
  idusuario: string;
  foto?: string | null;
  direccion: string;
  provincia: string;
  municipio: string;
  telefono: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ManicureCreationAttributes
  extends Optional<ManicureAtributos, "foto" | "createdAt" | "updatedAt"> { }

class Manicure
  extends Model<ManicureAtributos, ManicureCreationAttributes>
  implements ManicureAtributos {
  public idusuario!: string;
  public foto?: string | null;
  public direccion!: string;
  public provincia!: string;
  public municipio!: string;
  public telefono!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Manicure.init(
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
    foto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    provincia: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    municipio: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: "manicure",
    sequelize: database,
  }
);

export default Manicure;
