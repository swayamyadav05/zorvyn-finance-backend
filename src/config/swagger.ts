import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Zorvyn Finance API",
      version: "1.0.0",
      description:
        "A finance data processing and access control backend. " +
        "All endpoints are versioned under /api/v1. " +
        "Protected routes require a Bearer token in the Authorization header.",
    },

    servers: [
      {
        url:
          env.NODE_ENV === "production"
            ? "https://zorvyn-finance-backend.up.railway.app/api/v1"
            : `http://localhost:${env.PORT}/api/v1`,
        description:
          env.NODE_ENV === "production"
            ? "Production"
            : "Development",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your access token. Obtain one from POST /auth/login.",
        },
      },

      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: { type: "object" },
          },
        },

        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
            errors: {
              type: "object",
              description:
                "Field-level validation errors (only on 400 responses)",
              example: { email: ["Invalid email address"] },
            },
          },
        },

        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
          },
        },

        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "64f1a2b3c4d5e6f7a8b9c0d1",
            },
            name: { type: "string", example: "Admin User" },
            email: { type: "string", example: "admin@zorvyn.com" },
            role: {
              type: "string",
              enum: ["viewer", "analyst", "admin"],
              example: "admin",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Record: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "64f1a2b3c4d5e6f7a8b9c0d2",
            },
            amount: { type: "number", example: 85000 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "income",
            },
            category: {
              type: "string",
              enum: [
                "salary",
                "freelance",
                "investment",
                "food",
                "rent",
                "utilities",
                "entertainment",
                "transport",
                "other",
              ],
              example: "salary",
            },
            date: { type: "string", format: "date-time" },
            description: {
              type: "string",
              example: "Monthly salary",
            },
            notes: {
              type: "string",
              example: "Includes performance bonus",
            },
            createdBy: {
              type: "object",
              properties: {
                _id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },

    security: [{ BearerAuth: [] }],
  },

  apis:
    env.NODE_ENV === "production"
      ? ["./dist/modules/**/*.routes.js"]
      : ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
