import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface SubjectAttributes {
  id: string;
  teacherId: string;
  subjectName: string;
  description: string | null;
  subjectFileUrl: string;
  videoUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubjectCreationAttributes
  extends Optional<SubjectAttributes, "id" | "description" | "videoUrl" | "createdAt" | "updatedAt"> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: string;
  public teacherId!: string;
  public subjectName!: string;
  public description!: string | null;
  public subjectFileUrl!: string;
  public videoUrl!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "teachers", key: "id" },
      onDelete: "CASCADE",
    },
    subjectName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subjectFileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Subject",
    tableName: "subjects",
    timestamps: true,
  },
);

export default Subject;
