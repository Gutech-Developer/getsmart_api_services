import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentTestAttemptAttributes {
  id: string;
  studentId: string;
  diagnosticTestId: string;
  testQuestionPackageId: string;
  courseModuleId: string;
  attemptNumber: number;
  score: number | null;
  isPassed: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentTestAttemptCreationAttributes
  extends Optional<
    StudentTestAttemptAttributes,
    "id" | "score" | "isPassed" | "startedAt" | "completedAt" | "createdAt" | "updatedAt"
  > {}

class StudentTestAttempt
  extends Model<StudentTestAttemptAttributes, StudentTestAttemptCreationAttributes>
  implements StudentTestAttemptAttributes
{
  public id!: string;
  public studentId!: string;
  public diagnosticTestId!: string;
  public testQuestionPackageId!: string;
  public courseModuleId!: string;
  public attemptNumber!: number;
  public score!: number | null;
  public isPassed!: boolean;
  public startedAt!: Date | null;
  public completedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentTestAttempt.init(
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
    diagnosticTestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "diagnosticTests", key: "id" },
      onDelete: "CASCADE",
    },
    testQuestionPackageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "testQuestionPackages", key: "id" },
      onDelete: "CASCADE",
    },
    courseModuleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "courseModules", key: "id" },
      onDelete: "CASCADE",
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1 = initial diagnostic, 2 = remedial 1, 3 = remedial 2 (max)",
      validate: {
        min: 1,
        max: 3,
      },
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "StudentTestAttempt",
    tableName: "studentTestAttempts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: "unique_student_test_module_package_attempt",
        fields: ["studentId", "courseModuleId", "testQuestionPackageId", "attemptNumber"],
      },
    ],
  },
);

export default StudentTestAttempt;
