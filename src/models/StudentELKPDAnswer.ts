import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentELKPDAnswerAttributes {
  id: string;
  studentId: string;
  eLKPDId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentELKPDAnswerCreationAttributes
  extends Optional<
    StudentELKPDAnswerAttributes,
    "id" | "selectedOptionId" | "isCorrect" | "createdAt" | "updatedAt"
  > {}

class StudentELKPDAnswer
  extends Model<StudentELKPDAnswerAttributes, StudentELKPDAnswerCreationAttributes>
  implements StudentELKPDAnswerAttributes
{
  public id!: string;
  public studentId!: string;
  public eLKPDId!: string;
  public selectedOptionId!: string | null;
  public isCorrect!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentELKPDAnswer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
      onDelete: "CASCADE",
    },
    eLKPDId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "eLKPDs", key: "id" },
      onDelete: "CASCADE",
    },
    selectedOptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "eLKPDOptions", key: "id" },
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
    modelName: "StudentELKPDAnswer",
    tableName: "studentELKPDAnswers",
    timestamps: true,
  },
);

export default StudentELKPDAnswer;
