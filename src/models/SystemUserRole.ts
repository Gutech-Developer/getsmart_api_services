import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface SystemUserRoleAttributes {
  id: string;
  userId: string;
  systemRoleId: string;
}

interface SystemUserRoleCreationAttributes extends Optional<SystemUserRoleAttributes, "id"> {}

class SystemUserRole
  extends Model<SystemUserRoleAttributes, SystemUserRoleCreationAttributes>
  implements SystemUserRoleAttributes
{
  public id!: string;
  public userId!: string;
  public systemRoleId!: string;
}

SystemUserRole.init(
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
    systemRoleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "systemRoles", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "SystemUserRole",
    tableName: "systemUserRoles",
    timestamps: false,
  },
);

export default SystemUserRole;
