import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ELKPDAttributes {
  id: string;
  subjectId: string;
  fileUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ELKPDCreationAttributes
  extends Optional<ELKPDAttributes, "id" | "createdAt" | "updatedAt"> {}

class ELKPD extends Model<ELKPDAttributes, ELKPDCreationAttributes> implements ELKPDAttributes {
  public id!: string;
  public subjectId!: string;
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
