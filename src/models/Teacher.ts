import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TeacherAttributes {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  NIP: string | null;
  province: string;
  city: string;
  schoolId: string;
  schoolName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeacherCreationAttributes
  extends Optional<
    TeacherAttributes,
    "id" | "NIP" | "province" | "city" | "schoolId" | "schoolName" | "createdAt" | "updatedAt"
  > {}

class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes> implements TeacherAttributes {
  public id!: string;
  public userId!: string;
  public fullName!: string;
  public phoneNumber!: string;
  public NIP!: string | null;
  public province!: string;
  public city!: string;
  public schoolId!: string;
  public schoolName!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Teacher.init(
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
      unique: true,
    },
    NIP: {
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
    modelName: "Teacher",
    tableName: "teachers",
    timestamps: true,
  },
);

export default Teacher;
