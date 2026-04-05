import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { RecordModel } from "../src/modules/record/record.model";
import { loginAsAdmin, loginAsViewer } from "./helpers";

describe("Dashboard Aggregation Endpoints", () => {
  let adminToken: string;
  let viewerToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    const [admin, viewer] = await Promise.all([
      loginAsAdmin(),
      loginAsViewer(),
    ]);
    adminToken = admin.token;
    viewerToken = viewer.token;
    adminUserId = admin.user._id;

    await RecordModel.insertMany([
      {
        amount: 10000,
        type: "income",
        category: "salary",
        date: new Date(),
        createdBy: adminUserId,
      },
      {
        amount: 5000,
        type: "income",
        category: "freelance",
        date: new Date(),
        createdBy: adminUserId,
      },
      {
        amount: 3000,
        type: "expense",
        category: "rent",
        date: new Date(),
        createdBy: adminUserId,
      },
      {
        amount: 1000,
        type: "expense",
        category: "food",
        date: new Date(),
        createdBy: adminUserId,
      },
    ]);
  });

  describe("GET /api/v1/dashboard/summary", () => {
    it("should return correct totals and net balance", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(15000);
      expect(res.body.data.totalExpenses).toBe(4000);
      expect(res.body.data.netBalance).toBe(11000);
      expect(res.body.data.totalRecords).toBe(4);
    });

    it("should return zero defaults when there are no records", async () => {
      await RecordModel.deleteMany({});

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.netBalance).toBe(0);
    });

    it("should be accessible by a viewer — expects 200", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/v1/dashboard/category-totals", () => {
    it("should return one row per category/type combination", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/category-totals")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);

      expect(res.body.data[0].category).toBe("salary");
      expect(res.body.data[0].total).toBe(10000);
    });
  });

  describe("GET /api/v1/dashboard/recent", () => {
    it("should return at most 10 transactions with creator info populated", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/recent")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.data[0].createdBy).toHaveProperty("name");
      expect(res.body.data[0].createdBy).toHaveProperty("email");
      expect(res.body.data[0].createdBy.password).toBeUndefined();
    });
  });

  describe("GET /api/v1/dashboard/trends", () => {
    it("should return monthly data with year, month, type, and total fields", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/trends")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((entry: unknown) => {
        const e = entry as Record<string, unknown>;
        expect(e).toHaveProperty("year");
        expect(e).toHaveProperty("month");
        expect(e).toHaveProperty("type");
        expect(e).toHaveProperty("total");
      });
    });
  });
});
