import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/modules/user/user.model";

// Seed via model and log in via HTTP to get a real signed token quickly.
export const createUserAndLogin = async (
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    role: "viewer" | "analyst" | "admin";
    status: "active" | "inactive";
  }> = {},
) => {
  const defaults = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    role: "viewer" as const,
    status: "active" as const,
  };

  const userData = { ...defaults, ...overrides };

  await UserModel.create(userData);

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: userData.email, password: userData.password });

  return {
    token: loginRes.body.data?.accessToken as string,
    user: loginRes.body.data?.user,
  };
};

export const loginAsAdmin = () =>
  createUserAndLogin({
    email: "admin@test.com",
    role: "admin",
  });

export const loginAsAnalyst = () =>
  createUserAndLogin({
    email: "analyst@test.com",
    role: "analyst",
  });

export const loginAsViewer = () =>
  createUserAndLogin({
    email: "viewer@test.com",
    role: "viewer",
  });
