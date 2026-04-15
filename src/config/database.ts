import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";

configDotenv();

const dbUri = process.env.DB_URI;

if (!dbUri) {
  throw new Error("DB_URI is not defined in environment variables");
}

const sequelize = new Sequelize(dbUri, {
  dialect: "postgres",

  logging: process.env.NODE_ENV === "development" ? console.log : false,

  dialectOptions: {
    ssl:
      process.env.DB_SSL === "true"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  retry: {
    max: 3,
  },
});

const connectDB = async (): Promise<void> => {
  try {
    console.log("Connecting to PostgreSQL database...");

    await sequelize.authenticate();

    console.log("Database connection established");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synchronized");
    }
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
};

export { sequelize };
export default connectDB;
