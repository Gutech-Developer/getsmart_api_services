import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TestQuestionPackageAttributes {
  id: string;
  packageName: string | null;
  diagnosticTestId: string;
}

interface TestQuestionPackageCreationAttributes
  extends Optional<TestQuestionPackageAttributes, "id" | "packageName"> {}

class TestQuestionPackage
  extends Model<TestQuestionPackageAttributes, TestQuestionPackageCreationAttributes>
  implements TestQuestionPackageAttributes
{
  public id!: string;
  public packageName!: string | null;
  public diagnosticTestId!: string;
}

TestQuestionPackage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diagnosticTestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "diagnosticTests", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "TestQuestionPackage",
    tableName: "testQuestionPackages",
    timestamps: false,
  },
);

export default TestQuestionPackage;
