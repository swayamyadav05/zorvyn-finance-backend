import mongoose from "mongoose";
import { UserModel } from "./user.model";
import { ApiError } from "../../utils/ApiError";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
} from "./user.schema";

const validateObjectId = (id: string, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

export const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, role, status } = query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const [total, users] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string) => {
  validateObjectId(id, "User ID");

  const user = await UserModel.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};

export const createUser = async (input: CreateUserInput) => {
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await UserModel.create(input);
  return user;
};

export const updateUser = async (
  id: string,
  input: UpdateUserInput,
) => {
  validateObjectId(id, "User ID");

  const user = await UserModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  );

  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};

export const deactivateUser = async (
  id: string,
  requestingUserId: string,
) => {
  validateObjectId(id, "User ID");

  if (id === requestingUserId) {
    throw ApiError.badRequest(
      "You cannot deactivate your own account",
    );
  }

  const user = await UserModel.findByIdAndUpdate(
    id,
    { $set: { status: "inactive" } },
    { returnDocument: "after" },
  );

  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};
