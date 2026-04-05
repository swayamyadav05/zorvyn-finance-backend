import type { Document, Types } from "mongoose";
import type {
  RecordType,
  RecordCategory,
} from "../../config/constants";

export interface IRecord {
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: Date;
  description?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecordDocument extends IRecord, Document {
  _id: Types.ObjectId;
}
