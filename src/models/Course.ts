import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface CourseAttributes {
  id: string;
  courseName: string;
  teacherId: string;
  schoolId: string;
  schoolName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CourseCreationAttributes
  extends Optional<CourseAttributes, "id" | "createdAt" | "updatedAt"> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: string;
  public courseName!: string;
  public teacherId!: string;
  public schoolId!: string;
  public schoolName!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "teachers", key: "id" },
      onDelete: "CASCADE",
    },
    schoolId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Course",
    tableName: "courses",
    timestamps: true,
  },
);

export default Course;
