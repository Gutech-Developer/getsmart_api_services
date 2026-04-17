import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentELKPDSubmissionAttributes {
  id: string;
  studentId: string;
  eLKPDId: string;
  courseModuleId: string;
  submissionFileUrl: string;
  score: number | null;
  teacherNote: string | null;
  submittedAt: Date;
  gradedAt: Date | null;
  gradedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentELKPDSubmissionCreationAttributes
  extends Optional<
    StudentELKPDSubmissionAttributes,
    "id" | "score" | "teacherNote" | "submittedAt" | "gradedAt" | "gradedBy" | "createdAt" | "updatedAt"
  > {}

class StudentELKPDSubmission
  extends Model<StudentELKPDSubmissionAttributes, StudentELKPDSubmissionCreationAttributes>
  implements StudentELKPDSubmissionAttributes
{
  public id!: string;
  public studentId!: string;
  public eLKPDId!: string;
  public courseModuleId!: string;
  public submissionFileUrl!: string;
  public score!: number | null;
  public teacherNote!: string | null;
  public submittedAt!: Date;
  public gradedAt!: Date | null;
  public gradedBy!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentELKPDSubmission.init(
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
    courseModuleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "courseModules", key: "id" },
      onDelete: "CASCADE",
    },
    submissionFileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    teacherNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gradedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "teachers", key: "id" },
      onDelete: "SET NULL",
    },
  },
  {
    sequelize,
    modelName: "StudentELKPDSubmission",
    tableName: "studentELKPDSubmissions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "eLKPDId", "courseModuleId"],
        name: "unique_student_elkpd_module",
      },
    ],
  },
);

export default StudentELKPDSubmission;
