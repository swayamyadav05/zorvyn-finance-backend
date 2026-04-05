import { env } from "../config/env";

type LogLevel = "info" | "warn" | "error" | "debug";

const formatMessage = (
  level: LogLevel,
  message: string,
  meta?: unknown,
): string => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    // Keep test output readable by suppressing non-error logs.
    if (env.NODE_ENV === "test") return;
    console.log(formatMessage("info", message, meta));
  },

  warn: (message: string, meta?: unknown) => {
    if (env.NODE_ENV === "test") return;
    console.warn(formatMessage("warn", message, meta));
  },

  error: (message: string, meta?: unknown) => {
    // Always emit errors so test failures are visible.
    console.error(formatMessage("error", message, meta));
  },

  debug: (message: string, meta?: unknown) => {
    // Limit debug output to development.
    if (env.NODE_ENV !== "development") return;
    console.log(formatMessage("debug", message, meta));
  },
};
