import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { USER_ROLES } from "../../config/constants";
import * as recordController from "./record.controller";
import {
  createRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
} from "./record.schema";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: List financial records with filters
 *     description: Returns a paginated, sortable list of financial records. Supports filtering by type, category, and date range. Analyst and Admin only.
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [salary, freelance, investment, food, rent, utilities, entertainment, transport, other] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: "2026-03-31" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt], default: date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Records fetched successfully with pagination meta
 *       403:
 *         description: Viewer role cannot access records
 */
router.get(
  "/",
  authorize(USER_ROLES.ANALYST, USER_ROLES.ADMIN),
  validate(listRecordsSchema),
  recordController.listRecords,
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a single financial record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record fetched successfully
 *       404:
 *         description: Record not found
 */
router.get(
  "/:id",
  authorize(USER_ROLES.ANALYST, USER_ROLES.ADMIN),
  recordController.getRecordById,
);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a financial record
 *     description: Admin only. The record is automatically attributed to the authenticated admin user.
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount: { type: number, example: 85000 }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string, enum: [salary, freelance, investment, food, rent, utilities, entertainment, transport, other] }
 *               date: { type: string, format: date, example: "2026-04-01" }
 *               description: { type: string, example: "Monthly salary" }
 *               notes: { type: string, example: "Includes Q1 bonus" }
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post(
  "/",
  authorize(USER_ROLES.ADMIN),
  validate(createRecordSchema),
  recordController.createRecord,
);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record
 *     description: Admin only. Provide any subset of fields to update.
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 */
router.patch(
  "/:id",
  authorize(USER_ROLES.ADMIN),
  validate(updateRecordSchema),
  recordController.updateRecord,
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft delete a financial record
 *     description: Admin only. Sets isDeleted to true — the record is excluded from all future queries but preserved in the database for audit purposes.
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
router.delete(
  "/:id",
  authorize(USER_ROLES.ADMIN),
  recordController.deleteRecord,
);

export default router;
