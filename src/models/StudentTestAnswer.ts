import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentTestAnswerAttributes {
  id: string;
  attemptId: string;
  testQuestionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentTestAnswerCreationAttributes
  extends Optional<
    StudentTestAnswerAttributes,
    "id" | "selectedOptionId" | "isCorrect" | "createdAt" | "updatedAt"
  > {}

class StudentTestAnswer
  extends Model<StudentTestAnswerAttributes, StudentTestAnswerCreationAttributes>
  implements StudentTestAnswerAttributes
{
  public id!: string;
  public attemptId!: string;
  public testQuestionId!: string;
  public selectedOptionId!: string | null;
  public isCorrect!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentTestAnswer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    attemptId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "studentTestAttempts", key: "id" },
      onDelete: "CASCADE",
    },
    testQuestionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "testQuestions", key: "id" },
      onDelete: "CASCADE",
    },
    selectedOptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "testOptions", key: "id" },
      onDelete: "SET NULL",
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "StudentTestAnswer",
    tableName: "studentTestAnswers",
    timestamps: true,
  },
);

export default StudentTestAnswer;
