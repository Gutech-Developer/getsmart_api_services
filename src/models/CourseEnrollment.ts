import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface CourseEnrollmentAttributes {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CourseEnrollmentCreationAttributes
  extends Optional<CourseEnrollmentAttributes, "id" | "enrolledAt" | "isActive" | "createdAt" | "updatedAt"> {}

class CourseEnrollment
  extends Model<CourseEnrollmentAttributes, CourseEnrollmentCreationAttributes>
  implements CourseEnrollmentAttributes
{
  public id!: string;
  public studentId!: string;
  public courseId!: string;
  public enrolledAt!: Date;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CourseEnrollment.init(
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
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "courses", key: "id" },
      onDelete: "CASCADE",
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "CourseEnrollment",
    tableName: "courseEnrollments",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "courseId"],
      },
    ],
  },
);

export default CourseEnrollment;
