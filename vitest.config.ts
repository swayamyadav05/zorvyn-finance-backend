import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Keep integration tests isolated from shared in-memory DB state.
    pool: "forks",
    fileParallelism: false,

    // Allow enough time for DB startup and HTTP integration flows.
    testTimeout: 30000,

    // Boot the in-memory MongoDB server before tests run.
    globalSetup: "./tests/setup/global.setup.ts",

    // Reset DB state per test file.
    setupFiles: ["./tests/setup/file.setup.ts"],

    include: ["tests/**/*.test.ts"],

    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
    },
  },
});
