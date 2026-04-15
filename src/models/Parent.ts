import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ParentAttributes {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  city: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParentCreationAttributes
  extends Optional<
    ParentAttributes,
    "id" | "province" | "city" | "createdAt" | "updatedAt"
  > {}

class Parent extends Model<ParentAttributes, ParentCreationAttributes> implements ParentAttributes {
  public id!: string;
  public userId!: string;
  public fullName!: string;
  public phoneNumber!: string;
  public province!: string;
  public city!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Parent.init(
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
  },
  {
    sequelize,
    modelName: "Parent",
    tableName: "parents",
    timestamps: true,
  },
);

export default Parent;
