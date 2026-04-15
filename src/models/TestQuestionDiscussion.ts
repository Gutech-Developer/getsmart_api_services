import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface TestQuestionDiscussionAttributes {
  id: string;
  testQuestionId: string;
  textDiscussion: string | null;
  videoUrl: string | null;
}

interface TestQuestionDiscussionCreationAttributes
  extends Optional<TestQuestionDiscussionAttributes, "id" | "textDiscussion" | "videoUrl"> {}

class TestQuestionDiscussion
  extends Model<TestQuestionDiscussionAttributes, TestQuestionDiscussionCreationAttributes>
  implements TestQuestionDiscussionAttributes
{
  public id!: string;
  public testQuestionId!: string;
  public textDiscussion!: string | null;
  public videoUrl!: string | null;
}

TestQuestionDiscussion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    testQuestionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "testQuestions", key: "id" },
      onDelete: "CASCADE",
    },
    textDiscussion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "TestQuestionDiscussion",
    tableName: "testQuestionDiscussions",
    timestamps: false,
  },
);

export default TestQuestionDiscussion;
