import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { AuthProviderEnum } from "../types/enums";

export interface UserAttributes {
  id: string;
  email: string;
  password: string | null;
  isActive: boolean;
  authProvider: AuthProviderEnum;
  googleId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "isActive" | "authProvider" | "googleId" | "password" | "createdAt" | "updatedAt"
  > {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string | null;
  public isActive!: boolean;
  public authProvider!: AuthProviderEnum;
  public googleId!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public toJSON = (): Omit<UserAttributes, "password"> & Record<string, unknown> => {
    const values = { ...this.get() } as Record<string, unknown>;
    delete values.password;
    return values as Omit<UserAttributes, "password"> & Record<string, unknown>;
  };
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Please enter a valid email" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    authProvider: {
      type: DataTypes.ENUM(...Object.values(AuthProviderEnum)),
      allowNull: false,
      defaultValue: AuthProviderEnum.LOCAL,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {},
    },
  },
);

export default User;
