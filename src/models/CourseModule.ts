import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { ModuleTypeEnum } from "../types/enums";

export interface CourseModuleAttributes {
  id: string;
  order: number | null;
  type: ModuleTypeEnum | null;
  courseId: string;
  subjectId: string | null;
  diagnosticTestId: string | null;
  deadline: Date | null;
}

interface CourseModuleCreationAttributes
  extends Optional<
    CourseModuleAttributes,
    "id" | "order" | "type" | "subjectId" | "diagnosticTestId" | "deadline"
  > {}

class CourseModule
  extends Model<CourseModuleAttributes, CourseModuleCreationAttributes>
  implements CourseModuleAttributes
{
  public id!: string;
  public order!: number | null;
  public type!: ModuleTypeEnum | null;
  public courseId!: string;
  public subjectId!: string | null;
  public diagnosticTestId!: string | null;
  public deadline!: Date | null;
}

CourseModule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ModuleTypeEnum)),
      allowNull: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "courses", key: "id" },
      onDelete: "CASCADE",
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "subjects", key: "id" },
      onDelete: "SET NULL",
    },
    diagnosticTestId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "diagnosticTests", key: "id" },
      onDelete: "SET NULL",
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CourseModule",
    tableName: "courseModules",
    timestamps: false,
  },
);

export default CourseModule;
