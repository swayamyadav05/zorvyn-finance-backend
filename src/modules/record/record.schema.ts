import { z } from "zod";
import {
  RECORD_TYPES,
  RECORD_CATEGORIES,
} from "../../config/constants";

export const createRecordSchema = z.object({
  body: z.object({
    amount: z
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than 0"),

    type: z.enum(
      Object.values(RECORD_TYPES) as [string, ...string[]],
      {
        error: (issue) =>
          issue.input === undefined
            ? "Type is required"
            : "Type must be 'income' or 'expense'",
      },
    ),

    category: z.enum(
      [...RECORD_CATEGORIES] as [string, ...string[]],
      {
        error: "Category is required",
      },
    ),

    date: z.coerce.date().optional(),

    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .optional(),

    notes: z
      .string()
      .max(1000, "Notes must not exceed 1000 characters")
      .optional(),
  }),
});

// Require at least one mutable field to avoid no-op update requests.
export const updateRecordSchema = z.object({
  body: z
    .object({
      amount: z
        .number()
        .positive("Amount must be greater than 0")
        .optional(),
      type: z
        .enum(Object.values(RECORD_TYPES) as [string, ...string[]])
        .optional(),
      category: z
        .enum([...RECORD_CATEGORIES] as [string, ...string[]])
        .optional(),
      date: z.coerce.date().optional(),
      description: z.string().max(500).optional(),
      notes: z.string().max(1000).optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided to update" },
    ),
});

export const listRecordsSchema = z.object({
  query: z.object({
    type: z
      .enum(Object.values(RECORD_TYPES) as [string, ...string[]])
      .optional(),
    category: z
      .enum([...RECORD_CATEGORIES] as [string, ...string[]])
      .optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export type CreateRecordInput = z.infer<
  typeof createRecordSchema
>["body"];
export type UpdateRecordInput = z.infer<
  typeof updateRecordSchema
>["body"];
export type ListRecordsQuery = z.infer<
  typeof listRecordsSchema
>["query"];
