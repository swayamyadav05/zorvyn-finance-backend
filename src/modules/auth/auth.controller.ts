import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as authService from "./auth.service";
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from "./auth.schema";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const user = await authService.registerUser(input);

    res
      .status(201)
      .json(
        new ApiResponse("Account created successfully", { user }),
      );
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const { user, accessToken, refreshToken } =
      await authService.loginUser(input);

    res.status(200).json(
      new ApiResponse("Login successful", {
        user,
        accessToken,
        refreshToken,
      }),
    );
  },
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body as RefreshTokenInput;
    const { accessToken } =
      await authService.refreshAccessToken(token);

    res.status(200).json(
      new ApiResponse("Token refreshed successfully", {
        accessToken,
      }),
    );
  },
);

export const logout = asyncHandler(
  async (_req: Request, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse("Logged out successfully", null));
  },
);

export const me = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as Request & { user: { userId: string } })
      .user.userId;
    const user = await authService.getCurrentUser(userId);

    res
      .status(200)
      .json(
        new ApiResponse("Profile fetched successfully", { user }),
      );
  },
);
