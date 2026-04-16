import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentModuleProgressAttributes {
  id: string;
  studentId: string;
  courseModuleId: string;
  fileReadAt: Date | null;
  videoWatchedAt: Date | null;
  eLKPDSubmittedAt: Date | null;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentModuleProgressCreationAttributes
  extends Optional<
    StudentModuleProgressAttributes,
    | "id"
    | "fileReadAt"
    | "videoWatchedAt"
    | "eLKPDSubmittedAt"
    | "isCompleted"
    | "completedAt"
    | "createdAt"
    | "updatedAt"
  > {}

class StudentModuleProgress
  extends Model<StudentModuleProgressAttributes, StudentModuleProgressCreationAttributes>
  implements StudentModuleProgressAttributes
{
  public id!: string;
  public studentId!: string;
  public courseModuleId!: string;
  public fileReadAt!: Date | null;
  public videoWatchedAt!: Date | null;
  public eLKPDSubmittedAt!: Date | null;
  public isCompleted!: boolean;
  public completedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentModuleProgress.init(
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
    courseModuleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "courseModules", key: "id" },
      onDelete: "CASCADE",
    },
    fileReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    videoWatchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    eLKPDSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "StudentModuleProgress",
    tableName: "studentModuleProgress",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "courseModuleId"],
        name: "unique_student_course_module",
      },
    ],
  },
);

export default StudentModuleProgress;
