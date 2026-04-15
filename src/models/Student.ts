import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface StudentAttributes {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  NIS: string | null;
  province: string;
  city: string;
  schoolId: string;
  schoolName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentCreationAttributes
  extends Optional<
    StudentAttributes,
    "id" | "NIS" | "province" | "city" | "schoolId" | "schoolName" | "createdAt" | "updatedAt"
  > {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public userId!: string;
  public fullName!: string;
  public phoneNumber!: string;
  public NIS!: string | null;
  public province!: string;
  public city!: string;
  public schoolId!: string;
  public schoolName!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    NIS: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Aceh",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Banda Aceh",
    },
    schoolId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "01",
    },
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "MTsN Model Banda Aceh",
    },
  },
  {
    sequelize,
    modelName: "Student",
    tableName: "students",
    timestamps: true,
  },
);

export default Student;
