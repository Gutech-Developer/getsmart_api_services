import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { NotificationTypeEnum } from "../types/enums";

export interface NotificationTypeAttributes {
  id: string;
  type: NotificationTypeEnum;
  titleTemplate: string | null;
  descriptionTemplate: string | null;
}

interface NotificationTypeCreationAttributes
  extends Optional<NotificationTypeAttributes, "id" | "titleTemplate" | "descriptionTemplate"> {}

class NotificationType
  extends Model<NotificationTypeAttributes, NotificationTypeCreationAttributes>
  implements NotificationTypeAttributes
{
  public id!: string;
  public type!: NotificationTypeEnum;
  public titleTemplate!: string | null;
  public descriptionTemplate!: string | null;
}

NotificationType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationTypeEnum)),
      allowNull: false,
    },
    titleTemplate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descriptionTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "NotificationType",
    tableName: "notificationTypes",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["type"],
      },
    ],
  },
);

export default NotificationType;
