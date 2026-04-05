import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as userService from "./user.service";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
} from "./user.schema";

export const listUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const { users, meta } = await userService.listUsers(query);

    res
      .status(200)
      .json(
        new ApiResponse(
          "Users fetched successfully",
          { users },
          meta,
        ),
      );
  },
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (typeof userId !== "string" || userId.trim() === "") {
      throw ApiError.badRequest("Invalid user id");
    }

    const user = await userService.getUserById(userId);
    res
      .status(200)
      .json(new ApiResponse("User fetched successfully", { user }));
  },
);

export const createUser = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput;
    const user = await userService.createUser(input);
    res
      .status(201)
      .json(new ApiResponse("User created successfully", { user }));
  },
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (typeof userId !== "string" || userId.trim() === "") {
      throw ApiError.badRequest("Invalid user id");
    }

    const input = req.body as UpdateUserInput;
    const user = await userService.updateUser(userId, input);
    res
      .status(200)
      .json(new ApiResponse("User updated successfully", { user }));
  },
);

export const deactivateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (typeof userId !== "string" || userId.trim() === "") {
      throw ApiError.badRequest("Invalid user id");
    }

    const user = await userService.deactivateUser(
      userId,
      req.user.userId,
    );
    res
      .status(200)
      .json(
        new ApiResponse("User deactivated successfully", { user }),
      );
  },
);
