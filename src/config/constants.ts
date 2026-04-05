export const USER_ROLES = {
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type UserStatus =
  (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const RECORD_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type RecordType =
  (typeof RECORD_TYPES)[keyof typeof RECORD_TYPES];

export const RECORD_CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "food",
  "rent",
  "utilities",
  "entertainment",
  "transport",
  "other",
] as const;

export type RecordCategory = (typeof RECORD_CATEGORIES)[number];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
