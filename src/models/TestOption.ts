import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TestOptionAttributes {
  id: string;
  option: string;
  testQuestionId: string;
  textAnswer: string | null;
  imageAnswerUrl: string | null;
  isCorrect: boolean;
}

interface TestOptionCreationAttributes
  extends Optional<TestOptionAttributes, "id" | "textAnswer" | "imageAnswerUrl" | "isCorrect"> {}

class TestOption
  extends Model<TestOptionAttributes, TestOptionCreationAttributes>
  implements TestOptionAttributes
{
  public id!: string;
  public option!: string;
  public testQuestionId!: string;
  public textAnswer!: string | null;
  public imageAnswerUrl!: string | null;
  public isCorrect!: boolean;
}

TestOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    option: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      comment: "A, B, C, D",
    },
    testQuestionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "testQuestions", key: "id" },
      onDelete: "CASCADE",
    },
    textAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageAnswerUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "TestOption",
    tableName: "testOptions",
    timestamps: false,
  },
);

export default TestOption;
