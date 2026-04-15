import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TestQuestionAttributes {
  id: string;
  questionNumber: number;
  pembahasan: string;
  videoUrl: string;
  testPackageId: string;
  textQuestion: string | null;
  imageQuestionUrl: string | null;
}

interface TestQuestionCreationAttributes
  extends Optional<TestQuestionAttributes, "id" | "textQuestion" | "imageQuestionUrl"> {}

class TestQuestion
  extends Model<TestQuestionAttributes, TestQuestionCreationAttributes>
  implements TestQuestionAttributes
{
  public id!: string;
  public questionNumber!: number;
  public pembahasan!: string;
  public videoUrl!: string;
  public testPackageId!: string;
  public textQuestion!: string | null;
  public imageQuestionUrl!: string | null;
}

TestQuestion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pembahasan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    testPackageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "testQuestionPackages", key: "id" },
      onDelete: "CASCADE",
    },
    textQuestion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageQuestionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "TestQuestion",
    tableName: "testQuestions",
    timestamps: false,
  },
);

export default TestQuestion;
