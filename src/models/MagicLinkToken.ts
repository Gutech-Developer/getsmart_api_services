import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { MagicLinkPurposeEnum } from "../types/enums";

export interface MagicLinkTokenAttributes {
  id: string;
  email: string;
  token: string;
  purpose: MagicLinkPurposeEnum;
  expiresAt: Date;
  isUsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MagicLinkTokenCreationAttributes
  extends Optional<MagicLinkTokenAttributes, "id" | "isUsed" | "createdAt" | "updatedAt"> {}

class MagicLinkToken
  extends Model<MagicLinkTokenAttributes, MagicLinkTokenCreationAttributes>
  implements MagicLinkTokenAttributes
{
  public id!: string;
  public email!: string;
  public token!: string;
  public purpose!: MagicLinkPurposeEnum;
  public expiresAt!: Date;
  public isUsed!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isExpired = (): boolean => {
    return new Date() > this.expiresAt;
  };
}

MagicLinkToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    purpose: {
      type: DataTypes.ENUM(...Object.values(MagicLinkPurposeEnum)),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "MagicLinkToken",
    tableName: "magicLinkTokens",
    timestamps: true,
  },
);

export default MagicLinkToken;
