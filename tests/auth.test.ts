import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";
import { UserModel } from "../src/modules/user/user.model";
import { createUserAndLogin } from "./helpers";

describe("Auth Endpoints", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and return 201 with no password in response", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "secret123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("john@example.com");
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.role).toBe("viewer");
    });

    it("should return 409 when registering with a duplicate email", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "First",
        email: "duplicate@example.com",
        password: "pass123",
      });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Second",
          email: "duplicate@example.com",
          password: "pass123",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 with field errors when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "Incomplete" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 400 when email format is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Bad Email",
          email: "not-an-email",
          password: "pass123",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(Object.keys(res.body.errors).length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials and return both tokens", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "Login Test",
        email: "login@example.com",
        password: "pass123",
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "pass123" });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should return 401 with a vague message when password is wrong", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "Wrong Pass",
        email: "wrongpass@example.com",
        password: "correct",
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "wrongpass@example.com",
        password: "incorrect",
      });

      expect(res.status).toBe(401);
      // Keep auth failure messages ambiguous to avoid credential enumeration.
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should return 401 when email does not exist", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "ghost@example.com", password: "anything" });

      expect(res.status).toBe(401);
    });

    it("should return 403 when an inactive user tries to login", async () => {
      await UserModel.create({
        name: "Inactive",
        email: "inactive@example.com",
        password: "pass123",
        role: "viewer",
        status: "inactive",
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "inactive@example.com", password: "pass123" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return the current user profile with a valid token", async () => {
      const { token, user } = await createUserAndLogin({
        email: "me@example.com",
      });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return 401 when token is malformed", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer this.is.not.a.valid.jwt");

      expect(res.status).toBe(401);
    });
  });
});
