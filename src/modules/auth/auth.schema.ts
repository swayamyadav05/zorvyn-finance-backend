import { z } from "zod";

export const registerSchema = z.object({
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
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: "Email is required" })
      .email("Please provide a valid email address")
      .toLowerCase(),

    password: z.string({ error: "Password is required" }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      error: "Refresh token is required",
    }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshTokenInput = z.infer<
  typeof refreshTokenSchema
>["body"];
