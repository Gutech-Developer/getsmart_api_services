import { configDotenv } from "dotenv";
configDotenv();

import { sequelize } from "../config/database";
import "../models"; // ensure all models are registered

const runMigration = async (): Promise<void> => {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection established.");

    console.log("Running sync({ alter: true })...");
    await sequelize.sync({ alter: true });
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

runMigration();
