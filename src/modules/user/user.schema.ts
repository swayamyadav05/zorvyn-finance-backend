import { z } from "zod";
import { USER_ROLES, USER_STATUS } from "../../config/constants";

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),

    email: z
      .string({ error: "Email is required" })
      .email("Please provide a valid email address")
      .toLowerCase(),

    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),

    role: z
      .enum(Object.values(USER_ROLES) as [string, ...string[]])
      .default(USER_ROLES.VIEWER),
  }),
});

// Require at least one mutable field to avoid no-op update requests.
export const updateUserSchema = z.object({
  body: z
    .object({
      role: z
        .enum(Object.values(USER_ROLES) as [string, ...string[]])
        .optional(),
      status: z
        .enum(Object.values(USER_STATUS) as [string, ...string[]])
        .optional(),
    })
    .refine(
      (data) => data.role !== undefined || data.status !== undefined,
      {
        message:
          "At least one field (role or status) must be provided",
      },
    ),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z
      .enum(Object.values(USER_ROLES) as [string, ...string[]])
      .optional(),
    status: z
      .enum(Object.values(USER_STATUS) as [string, ...string[]])
      .optional(),
  }),
});

export type CreateUserInput = z.infer<
  typeof createUserSchema
>["body"];
export type UpdateUserInput = z.infer<
  typeof updateUserSchema
>["body"];
export type ListUsersQuery = z.infer<typeof listUsersSchema>["query"];
