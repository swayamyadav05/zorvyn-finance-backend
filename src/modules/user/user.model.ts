import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLES, USER_STATUS } from "../../config/constants";
import type { IUserDocument } from "./user.types";

const BCRYPT_SALT_ROUNDS = 10;

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.VIEWER,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(_doc, ret) {
        const {
          password: _password,
          __v: _version,
          ...sanitized
        } = ret;
        return sanitized;
      },
    },
  },
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(
    this.password,
    BCRYPT_SALT_ROUNDS,
  );
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUserDocument>(
  "User",
  userSchema,
);
