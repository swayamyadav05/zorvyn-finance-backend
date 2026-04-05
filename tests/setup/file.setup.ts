import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "vitest";

beforeAll(async () => {
  // Guard against duplicate connections in shared worker processes.
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
});

beforeEach(async () => {
  // Isolate test files by resetting all collections.
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
