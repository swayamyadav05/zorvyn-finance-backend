import mongoose from "mongoose";
import { env } from "./env";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected");

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnect.");
      connectDB();
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (retryCount < MAX_RETRIES) {
      console.warn(
        `MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );
      console.warn(`Cause: ${errorMessage}`);
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS),
      );
      return connectDB(retryCount + 1);
    }

    console.error(
      "Could not connect to MongoDB after maximum retries. Exiting.",
    );
    console.error(`Last error: ${errorMessage}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
};
