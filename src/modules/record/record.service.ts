import mongoose from "mongoose";
import { RecordModel } from "./record.model";
import { ApiError } from "../../utils/ApiError";
import { PAGINATION } from "../../config/constants";
import type {
  CreateRecordInput,
  UpdateRecordInput,
  ListRecordsQuery,
} from "./record.schema";

const validateObjectId = (id: string, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

export const createRecord = async (
  input: CreateRecordInput,
  userId: string,
) => {
  const record = await RecordModel.create({
    ...input,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  return record;
};

export const listRecords = async (query: ListRecordsQuery) => {
  const { type, category, startDate, endDate, sortBy, order } = query;

  const page = Number(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    Number(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );

  const filter: Record<string, unknown> = { isDeleted: false };

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate)
      (filter.date as Record<string, unknown>).$gte = startDate;
    if (endDate)
      (filter.date as Record<string, unknown>).$lte = endDate;
  }

  const sortOrder = order === "asc" ? 1 : -1;

  const [total, records] = await Promise.all([
    RecordModel.countDocuments(filter),
    RecordModel.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name email"),
  ]);

  return {
    records,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRecordById = async (id: string) => {
  validateObjectId(id, "Record ID");

  const record = await RecordModel.findById(id).populate(
    "createdBy",
    "name email",
  );

  if (!record) {
    throw ApiError.notFound("Record not found");
  }
  return record;
};

export const updateRecord = async (
  id: string,
  input: UpdateRecordInput,
) => {
  validateObjectId(id, "Record ID");

  const record = await RecordModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  ).populate("createdBy", "name email");

  if (!record) {
    throw ApiError.notFound("Record not found");
  }
  return record;
};

export const softDeleteRecord = async (id: string) => {
  validateObjectId(id, "Record ID");

  const record = await RecordModel.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { returnDocument: "after" },
  );

  if (!record) {
    throw ApiError.notFound("Record not found");
  }
  return record;
};
