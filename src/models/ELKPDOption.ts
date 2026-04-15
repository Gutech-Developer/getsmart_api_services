import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ELKPDOptionAttributes {
  id: string;
  eLKPDId: string;
  answer: string;
  isCorrect: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ELKPDOptionCreationAttributes
  extends Optional<ELKPDOptionAttributes, "id" | "isCorrect" | "createdAt" | "updatedAt"> {}

class ELKPDOption
  extends Model<ELKPDOptionAttributes, ELKPDOptionCreationAttributes>
  implements ELKPDOptionAttributes
{
  public id!: string;
  public eLKPDId!: string;
  public answer!: string;
  public isCorrect!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ELKPDOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eLKPDId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "eLKPDs", key: "id" },
      onDelete: "CASCADE",
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "ELKPDOption",
    tableName: "eLKPDOptions",
    timestamps: true,
  },
);

export default ELKPDOption;
