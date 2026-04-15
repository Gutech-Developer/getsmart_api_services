import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface DiagnosticTestAttributes {
  id: string;
  teacherId: string;
  testName: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DiagnosticTestCreationAttributes
  extends Optional<DiagnosticTestAttributes, "id" | "description" | "createdAt" | "updatedAt"> {}

class DiagnosticTest
  extends Model<DiagnosticTestAttributes, DiagnosticTestCreationAttributes>
  implements DiagnosticTestAttributes
{
  public id!: string;
  public teacherId!: string;
  public testName!: string;
  public description!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DiagnosticTest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "teachers", key: "id" },
      onDelete: "CASCADE",
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DiagnosticTest",
    tableName: "diagnosticTests",
    timestamps: true,
  },
);

export default DiagnosticTest;
