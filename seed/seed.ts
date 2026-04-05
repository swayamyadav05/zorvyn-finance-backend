import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../src/modules/user/user.model";
import { RecordModel } from "../src/modules/record/record.model";

dotenv.config();

// ─── Helper ───────────────────────────────────────────────────────────────────

// Generates a Date object for a specific number of months ago,
// with a specific day of the month. This lets us spread seed records
// across the last 6 months in a controlled, readable way.
const dateMonthsAgo = (monthsAgo: number, day: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(day);
  date.setHours(0, 0, 0, 0);
  return date;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const USERS = [
  {
    name: "Admin User",
    email: "admin@zorvyn.com",
    password: "admin123",
    role: "admin" as const,
    status: "active" as const,
  },
  {
    name: "Analyst User",
    email: "analyst@zorvyn.com",
    password: "analyst123",
    role: "analyst" as const,
    status: "active" as const,
  },
  {
    name: "Viewer User",
    email: "viewer@zorvyn.com",
    password: "viewer123",
    role: "viewer" as const,
    status: "active" as const,
  },
  {
    name: "Inactive User",
    email: "inactive@zorvyn.com",
    password: "inactive123",
    role: "viewer" as const,
    status: "inactive" as const,
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in your .env file");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    // ── Wipe existing data ──────────────────────────────────────────────────
    // We clear both collections before seeding so re-running the script
    // always produces a clean, predictable state without duplicates.
    console.log("Clearing existing users and records...");
    await Promise.all([
      UserModel.deleteMany({}),
      RecordModel.deleteMany({}),
    ]);
    console.log("Collections cleared.");

    // ── Create Users ────────────────────────────────────────────────────────
    // We use UserModel.create() so the pre-save hook fires and passwords
    // are hashed exactly as they would be in production. Never insert
    // plain-text passwords directly with insertMany().
    console.log("Seeding users...");
    const createdUsers = await Promise.all(
      USERS.map((user) => UserModel.create(user)),
    );

    // Grab the admin user's ID — all financial records will be attributed
    // to the admin since only admins can create records per the RBAC spec
    const adminUser = createdUsers.find((u) => u.role === "admin");
    if (!adminUser) throw new Error("Admin user creation failed");

    const adminId = adminUser._id;
    console.log(`${createdUsers.length} users created.`);

    // ── Create Financial Records ─────────────────────────────────────────────
    // 25 records spread across the last 6 months, mixing income and expense
    // types across all categories. This gives the dashboard aggregations
    // realistic, varied data to work with.
    console.log("Seeding financial records...");

    const records = [
      // ── 6 months ago ──────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(6, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(6, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 4200,
        type: "expense",
        category: "food",
        date: dateMonthsAgo(6, 15),
        description: "Groceries and dining",
        createdBy: adminId,
      },
      {
        amount: 8000,
        type: "income",
        category: "freelance",
        date: dateMonthsAgo(6, 20),
        description: "Logo design project",
        createdBy: adminId,
      },

      // ── 5 months ago ──────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(5, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(5, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 1500,
        type: "expense",
        category: "utilities",
        date: dateMonthsAgo(5, 10),
        description: "Electricity and internet bill",
        createdBy: adminId,
      },
      {
        amount: 15000,
        type: "income",
        category: "investment",
        date: dateMonthsAgo(5, 25),
        description: "Mutual fund dividend",
        createdBy: adminId,
      },

      // ── 4 months ago ──────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(4, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(4, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 5500,
        type: "expense",
        category: "entertainment",
        date: dateMonthsAgo(4, 14),
        description: "Concert tickets and dinner",
        createdBy: adminId,
      },
      {
        amount: 2200,
        type: "expense",
        category: "transport",
        date: dateMonthsAgo(4, 20),
        description: "Fuel and cab charges",
        createdBy: adminId,
      },
      {
        amount: 12000,
        type: "income",
        category: "freelance",
        date: dateMonthsAgo(4, 22),
        description: "React dashboard project",
        createdBy: adminId,
      },

      // ── 3 months ago ──────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(3, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(3, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 3800,
        type: "expense",
        category: "food",
        date: dateMonthsAgo(3, 12),
        description: "Groceries and restaurant",
        createdBy: adminId,
      },
      {
        amount: 1100,
        type: "expense",
        category: "utilities",
        date: dateMonthsAgo(3, 8),
        description: "Internet and electricity",
        createdBy: adminId,
      },
      {
        amount: 20000,
        type: "income",
        category: "investment",
        date: dateMonthsAgo(3, 18),
        description: "Stock portfolio gain",
        createdBy: adminId,
      },

      // ── 2 months ago ──────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(2, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(2, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 4000,
        type: "expense",
        category: "entertainment",
        date: dateMonthsAgo(2, 16),
        description: "Weekend trip expenses",
        createdBy: adminId,
      },
      {
        amount: 9500,
        type: "income",
        category: "freelance",
        date: dateMonthsAgo(2, 24),
        description: "API integration project",
        createdBy: adminId,
      },

      // ── 1 month ago ───────────────────────────────────────────────────────
      {
        amount: 85000,
        type: "income",
        category: "salary",
        date: dateMonthsAgo(1, 1),
        description: "Monthly salary",
        createdBy: adminId,
      },
      {
        amount: 25000,
        type: "expense",
        category: "rent",
        date: dateMonthsAgo(1, 3),
        description: "Monthly rent",
        createdBy: adminId,
      },
      {
        amount: 1800,
        type: "expense",
        category: "transport",
        date: dateMonthsAgo(1, 10),
        description: "Monthly commute costs",
        createdBy: adminId,
      },
    ];

    // Use insertMany for records — no pre-save hook needed since records
    // don't have any hook-based transformations like password hashing
    await RecordModel.insertMany(records);
    console.log(`${records.length} financial records created.`);

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log("\nSeed complete! Here's what was created:");
    console.log(`    Users : ${createdUsers.length}`);
    console.log(`    Records : ${records.length}`);
    console.log("\nLogin credentials:");
    USERS.forEach((u) => {
      console.log(
        `    ${u.role.padEnd(8)} | ${u.email} | ${u.password}`,
      );
    });
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
  }
};

seed();
