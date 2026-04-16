import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ELKPDAttributes {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ELKPDCreationAttributes
  extends Optional<ELKPDAttributes, "id" | "description" | "createdAt" | "updatedAt"> {}

class ELKPD extends Model<ELKPDAttributes, ELKPDCreationAttributes> implements ELKPDAttributes {
  public id!: string;
  public subjectId!: string;
  public title!: string;
  public description!: string | null;
  public fileUrl!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ELKPD.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "subjects", key: "id" },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ELKPD",
    tableName: "eLKPDs",
    timestamps: true,
  },
);

export default ELKPD;
