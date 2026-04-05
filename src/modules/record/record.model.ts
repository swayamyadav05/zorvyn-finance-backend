import mongoose, { Schema } from "mongoose";
import {
  RECORD_TYPES,
  RECORD_CATEGORIES,
} from "../../config/constants";
import type { IRecordDocument } from "./record.types";

const recordSchema = new Schema<IRecordDocument>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    type: {
      type: String,
      enum: Object.values(RECORD_TYPES),
      required: [true, "Record type is required"],
    },

    category: {
      type: String,
      enum: [...RECORD_CATEGORIES],
      required: [true, "Category is required"],
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },

    description: {
      type: String,
      maxlength: [500, "Description must not exceed 500 characters"],
      trim: true,
    },

    notes: {
      type: String,
      maxlength: [1000, "Notes must not exceed 1000 characters"],
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(_doc, ret) {
        const {
          isDeleted: _isDeleted,
          __v: _version,
          ...sanitized
        } = ret;
        return sanitized;
      },
    },
  },
);

recordSchema.index({ date: -1 });
recordSchema.index({ type: 1 });
recordSchema.index({ category: 1 });
recordSchema.index({ createdBy: 1 });
recordSchema.index({ isDeleted: 1, date: -1 });

// Keep soft-deleted records excluded unless a query explicitly sets isDeleted.
recordSchema.pre(/^find/, function () {
  const query = this as mongoose.Query<unknown, IRecordDocument>;

  if (query.getFilter().isDeleted === undefined) {
    query.where({ isDeleted: false });
  }
});

export const RecordModel = mongoose.model<IRecordDocument>(
  "Record",
  recordSchema,
);
