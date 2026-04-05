import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as recordService from "./record.service";
import type {
  CreateRecordInput,
  UpdateRecordInput,
  ListRecordsQuery,
} from "./record.schema";

export const createRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const record = await recordService.createRecord(
      req.body as CreateRecordInput,
      req.user.userId,
    );
    res
      .status(201)
      .json(
        new ApiResponse("Record created successfully", { record }),
      );
  },
);

export const listRecords = asyncHandler(
  async (req: Request, res: Response) => {
    const { records, meta } = await recordService.listRecords(
      req.query as unknown as ListRecordsQuery,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          "Records fetched successfully",
          { records },
          meta,
        ),
      );
  },
);

export const getRecordById = asyncHandler(
  async (req: Request, res: Response) => {
    const recordId = req.params.id;
    if (typeof recordId !== "string" || recordId.trim() === "") {
      throw ApiError.badRequest("Invalid record id");
    }

    const record = await recordService.getRecordById(recordId);
    res
      .status(200)
      .json(
        new ApiResponse("Record fetched successfully", { record }),
      );
  },
);

export const updateRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const recordId = req.params.id;
    if (typeof recordId !== "string" || recordId.trim() === "") {
      throw ApiError.badRequest("Invalid record id");
    }

    const record = await recordService.updateRecord(
      recordId,
      req.body as UpdateRecordInput,
    );
    res
      .status(200)
      .json(
        new ApiResponse("Record updated successfully", { record }),
      );
  },
);

export const deleteRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const recordId = req.params.id;
    if (typeof recordId !== "string" || recordId.trim() === "") {
      throw ApiError.badRequest("Invalid record id");
    }

    await recordService.softDeleteRecord(recordId);
    res
      .status(200)
      .json(new ApiResponse("Record deleted successfully", null));
  },
);
