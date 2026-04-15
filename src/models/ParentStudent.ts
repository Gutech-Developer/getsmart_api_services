import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ParentStudentAttributes {
  id: string;
  parentId: string;
  studentId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParentStudentCreationAttributes
  extends Optional<ParentStudentAttributes, "id" | "createdAt" | "updatedAt"> {}

class ParentStudent
  extends Model<ParentStudentAttributes, ParentStudentCreationAttributes>
  implements ParentStudentAttributes
{
  public id!: string;
  public parentId!: string;
  public studentId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParentStudent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "parents", key: "id" },
      onDelete: "CASCADE",
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "ParentStudent",
    tableName: "parentStudents",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["parentId", "studentId"],
      },
    ],
  },
);

export default ParentStudent;
