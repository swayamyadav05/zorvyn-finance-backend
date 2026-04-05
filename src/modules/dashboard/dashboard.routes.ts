import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as dashboardController from "./dashboard.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Financial summary
 *     description: Returns total income, total expenses, net balance, and total record count. Uses a MongoDB aggregation pipeline. Accessible to all authenticated users.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Summary fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Summary fetched successfully
 *               data:
 *                 totalIncome: 272000
 *                 totalExpenses: 36200
 *                 netBalance: 235800
 *                 totalRecords: 10
 */
router.get("/summary", dashboardController.getSummary);

/**
 * @swagger
 * /dashboard/category-totals:
 *   get:
 *     summary: Income and expense breakdown by category
 *     description: Groups all records by category and type, returning total amount and count per group sorted by total descending.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Category totals fetched successfully
 */
router.get("/category-totals", dashboardController.getCategoryTotals);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Last 10 transactions
 *     description: Returns the 10 most recent non-deleted financial records, sorted by date descending, with creator details populated.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent transactions fetched successfully
 */
router.get("/recent", dashboardController.getRecentTransactions);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Monthly income vs expense trends
 *     description: Groups records by year, month, and type for the last 6 months. Each entry represents either total income or total expenses for that month — ideal for plotting a comparison line chart.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Monthly trends fetched successfully
 */
router.get("/trends", dashboardController.getMonthlyTrends);

export default router;
