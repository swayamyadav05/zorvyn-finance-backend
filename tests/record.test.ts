import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { loginAsAdmin, loginAsAnalyst } from "./helpers";

describe("Financial Record CRUD", () => {
  let adminToken: string;
  let analystToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    const [admin, analyst] = await Promise.all([
      loginAsAdmin(),
      loginAsAnalyst(),
    ]);
    adminToken = admin.token;
    analystToken = analyst.token;
    adminUserId = admin.user._id;
  });

  describe("POST /api/v1/records", () => {
    it("should create a record with valid data and return 201", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 85000,
          type: "income",
          category: "salary",
          date: "2026-03-01",
          description: "Monthly salary",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.record.amount).toBe(85000);
      expect(res.body.data.record.type).toBe("income");
      expect(res.body.data.record.createdBy).toBeDefined();
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 1000 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 400 when amount is zero or negative", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: -500, type: "expense", category: "food" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when category is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          type: "income",
          category: "not-a-valid-category",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/records", () => {
    beforeEach(async () => {
      await Promise.all([
        request(app)
          .post("/api/v1/records")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            amount: 85000,
            type: "income",
            category: "salary",
            date: "2026-01-15",
          }),
        request(app)
          .post("/api/v1/records")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            amount: 25000,
            type: "expense",
            category: "rent",
            date: "2026-01-03",
          }),
        request(app)
          .post("/api/v1/records")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            amount: 5000,
            type: "income",
            category: "freelance",
            date: "2026-02-10",
          }),
      ]);
    });

    it("should return all records with pagination meta", async () => {
      const res = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(3);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(1);
    });

    it("should filter records by type correctly", async () => {
      const res = await request(app)
        .get("/api/v1/records?type=income")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      res.body.data.records.forEach((r: { type: string }) => {
        expect(r.type).toBe("income");
      });
    });

    it("should filter records by date range correctly", async () => {
      const res = await request(app)
        .get(
          "/api/v1/records?startDate=2026-01-01&endDate=2026-01-31",
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
    });

    it("should respect pagination limit", async () => {
      const res = await request(app)
        .get("/api/v1/records?limit=2&page=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.meta.totalPages).toBe(2);
    });
  });

  describe("DELETE /api/v1/records/:id (soft delete)", () => {
    it("should soft delete a record and exclude it from subsequent queries", async () => {
      const createRes = await request(app)
        .post("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 1000, type: "income", category: "other" });

      const recordId = createRes.body.data.record._id;

      const beforeDelete = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(beforeDelete.body.data.records).toHaveLength(1);

      const deleteRes = await request(app)
        .delete(`/api/v1/records/${recordId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);

      const afterDelete = await request(app)
        .get("/api/v1/records")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(afterDelete.body.data.records).toHaveLength(0);
      expect(afterDelete.body.meta.total).toBe(0);
    });
  });
});
