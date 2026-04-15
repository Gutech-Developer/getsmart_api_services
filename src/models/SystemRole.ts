import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { SystemRoleEnum } from "../types/enums";

export interface SystemRoleAttributes {
  id: string;
  name: SystemRoleEnum;
}

interface SystemRoleCreationAttributes extends Optional<SystemRoleAttributes, "id"> {}

class SystemRole extends Model<SystemRoleAttributes, SystemRoleCreationAttributes> implements SystemRoleAttributes {
  public id!: string;
  public name!: SystemRoleEnum;
}

SystemRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM(...Object.values(SystemRoleEnum)),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "SystemRole",
    tableName: "systemRoles",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);

export default SystemRole;
