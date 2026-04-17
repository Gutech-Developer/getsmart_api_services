import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface DiagnosticTestAttributes {
  id: string;
  teacherId: string;
  testName: string;
  description: string | null;
  durationMinutes: number;
  passingScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DiagnosticTestCreationAttributes
  extends Optional<DiagnosticTestAttributes, "id" | "description" | "passingScore" | "createdAt" | "updatedAt"> {}

class DiagnosticTest
  extends Model<DiagnosticTestAttributes, DiagnosticTestCreationAttributes>
  implements DiagnosticTestAttributes
{
  public id!: string;
  public teacherId!: string;
  public testName!: string;
  public description!: string | null;
  public durationMinutes!: number;
  public passingScore!: number;

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
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Durasi tes dalam menit",
    },
    passingScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "KKM — ambang batas nilai kelulusan",
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
