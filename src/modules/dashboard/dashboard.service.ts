import { RecordModel } from "../record/record.model";

export const getSummary = async () => {
  const result = await RecordModel.aggregate([
    // aggregate() does not run query middleware, so soft-delete filtering is explicit.
    { $match: { isDeleted: false } },

    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
        totalRecords: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpenses: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
        totalRecords: 1,
      },
    },
  ]);

  // Return a stable zeroed payload when no records exist.
  return (
    result[0] ?? {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      totalRecords: 0,
    }
  );
};

export const getCategoryTotals = async () => {
  const results = await RecordModel.aggregate([
    { $match: { isDeleted: false } },

    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },

    { $sort: { total: -1 } },

    {
      $project: {
        _id: 0,
        category: "$_id.category",
        type: "$_id.type",
        total: 1,
        count: 1,
      },
    },
  ]);

  return results;
};

export const getRecentTransactions = async () => {
  const results = await RecordModel.aggregate([
    { $match: { isDeleted: false } },
    { $sort: { date: -1 } },
    { $limit: 10 },

    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },

    { $unwind: "$createdBy" },

    {
      $project: {
        amount: 1,
        type: 1,
        category: 1,
        date: 1,
        description: 1,
        createdAt: 1,
        "createdBy._id": 1,
        "createdBy.name": 1,
        "createdBy.email": 1,
      },
    },
  ]);

  return results;
};

export const getMonthlyTrends = async () => {
  const sixMonthsAgo = new Date();
  // Normalize to month boundary so trend buckets stay consistent.
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const results = await RecordModel.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: sixMonthsAgo },
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },

    { $sort: { "_id.year": 1, "_id.month": 1 } },

    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        type: "$_id.type",
        total: 1,
        count: 1,
      },
    },
  ]);

  return results;
};
