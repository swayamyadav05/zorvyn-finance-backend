import { MongoMemoryServer } from "mongodb-memory-server";

// Use globalThis because setup and teardown run in separate contexts.
declare global {
  // eslint-disable-next-line no-var
  var __MONGO_SERVER__: MongoMemoryServer;
}

export async function setup() {
  const mongoServer = await MongoMemoryServer.create();

  // Set env before app imports so env validation resolves test values.
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET =
    "test-access-secret-at-least-16-chars";
  process.env.JWT_REFRESH_SECRET =
    "test-refresh-secret-at-least-16-chars";
  process.env.JWT_ACCESS_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.PORT = "5001";

  globalThis.__MONGO_SERVER__ = mongoServer;
}

export async function teardown() {
  if (globalThis.__MONGO_SERVER__) {
    await globalThis.__MONGO_SERVER__.stop();
  }
}
