import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { RecordModel } from "../src/modules/record/record.model";
import {
  loginAsAdmin,
  loginAsAnalyst,
  loginAsViewer,
} from "./helpers";

describe("Role-Based Access Control", () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let recordId: string;

  beforeEach(async () => {
    const [admin, analyst, viewer] = await Promise.all([
      loginAsAdmin(),
      loginAsAnalyst(),
      loginAsViewer(),
    ]);

    adminToken = admin.token;
    analystToken = analyst.token;
    viewerToken = viewer.token;

    const record = await RecordModel.create({
      amount: 5000,
      type: "income",
      category: "salary",
      date: new Date(),
      createdBy: admin.user._id,
    });

    recordId = record._id.toString();
  });

  describe("Financial Records access", () => {
    it("viewer CANNOT view the records list — expects 403", async () => {
      const res = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it("analyst CAN view the records list — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it("admin CAN view the records list — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("viewer CANNOT create a record — expects 403", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ amount: 1000, type: "income", category: "salary" });

      expect(res.status).toBe(403);
    });

    it("analyst CANNOT create a record — expects 403", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ amount: 1000, type: "income", category: "salary" });

      expect(res.status).toBe(403);
    });

    it("admin CAN create a record — expects 201", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 1000, type: "income", category: "salary" });

      expect(res.status).toBe(201);
    });

    it("analyst CANNOT delete a record — expects 403", async () => {
      const res = await request(app)
        .delete(`/api/v1/records/${recordId}`)
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Dashboard access", () => {
    it("viewer CAN view dashboard summary — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });

    it("viewer CAN view category totals — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/category-totals")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });

    it("unauthenticated request to dashboard is rejected — expects 401", async () => {
      const res = await request(app).get("/api/v1/dashboard/summary");
      expect(res.status).toBe(401);
    });
  });

  describe("User management access", () => {
    it("viewer CANNOT list users — expects 403", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it("analyst CANNOT list users — expects 403", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });

    it("admin CAN list users — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
