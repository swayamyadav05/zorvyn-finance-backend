import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as dashboardService from "./dashboard.service";

export const getSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();
    res
      .status(200)
      .json(new ApiResponse("Summary fetched successfully", summary));
  },
);

export const getCategoryTotals = asyncHandler(
  async (_req: Request, res: Response) => {
    const totals = await dashboardService.getCategoryTotals();
    res
      .status(200)
      .json(
        new ApiResponse(
          "Category totals fetched successfully",
          totals,
        ),
      );
  },
);

export const getRecentTransactions = asyncHandler(
  async (_req: Request, res: Response) => {
    const transactions =
      await dashboardService.getRecentTransactions();
    res
      .status(200)
      .json(
        new ApiResponse(
          "Recent transactions fetched successfully",
          transactions,
        ),
      );
  },
);

export const getMonthlyTrends = asyncHandler(
  async (_req: Request, res: Response) => {
    const trends = await dashboardService.getMonthlyTrends();
    res
      .status(200)
      .json(
        new ApiResponse(
          "Monthly trends fetched successfully",
          trends,
        ),
      );
  },
);
