import jwt from "jsonwebtoken";
import { UserModel } from "../user/user.model";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { USER_STATUS } from "../../config/constants";
import type { RegisterInput, LoginInput } from "./auth.schema";
import type { IUserDocument } from "../user/user.types";

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (user: IUserDocument): string => {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role } as TokenPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions,
  );
};

export const generateRefreshToken = (user: IUserDocument): string => {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role } as TokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await UserModel.findOne({
    email: input.email,
  });
  if (existingUser) {
    throw ApiError.conflict(
      "An account with this email already exists",
    );
  }

  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  return user;
};

export const loginUser = async (input: LoginInput) => {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+password",
  );

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw ApiError.forbidden(
      "Your account has been deactivated. Please contact an administrator.",
    );
  }

  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  let payload: TokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await UserModel.findById(payload.userId);
  if (!user || user.status === USER_STATUS.INACTIVE) {
    throw ApiError.unauthorized(
      "User no longer exists or is inactive",
    );
  }

  const newAccessToken = generateAccessToken(user);
  return { accessToken: newAccessToken };
};

export const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};
