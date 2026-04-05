import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: z.ZodObject<z.ZodRawShape>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten()
        .fieldErrors as Record<string, string[]>;

      const cleanErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(fieldErrors)) {
        const cleanKey = key.replace(/^(body|query|params)\./, "");
        cleanErrors[cleanKey] = value as string[];
      }

      return next(
        ApiError.badRequest("Validation failed", cleanErrors),
      );
    }

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }

    if (result.data.query !== undefined) {
      Object.assign(req.query, result.data.query);
    }

    if (result.data.params !== undefined) {
      Object.assign(req.params, result.data.params);
    }

    next();
  };
};
