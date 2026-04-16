import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { db } from "../db/index.js";
import { transactions, budgets, subscriptions, categoryRules } from "../db/schema.js";
import { eq, and, gte, lte, desc, inArray, sql } from "drizzle-orm";

const router = express.Router();

router.use(authRequired);

// Helper to cast decimal strings to numbers and alias id to _id
const formatTransaction = (t) => ({
  ...t,
  _id: t.id,
  amount: parseFloat(t.amount),
});

router.get("/transactions", async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Evaluate recurring subscriptions
    const activeSubs = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true),
        lte(subscriptions.nextChargeDate, now)
      ));
    
    for (const sub of activeSubs) {
      // Create the missing transaction
      await db.insert(transactions).values({
        userId,
        type: "expense",
        amount: sub.amount,
        category: sub.category,
        date: sub.nextChargeDate,
        description: `Auto-generated: ${sub.name}`,
      });

      // Advance next charge date
      let nextDate = new Date(sub.nextChargeDate);
      if (sub.frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
      else if (sub.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (sub.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (sub.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      await db.update(subscriptions)
        .set({ nextChargeDate: nextDate })
        .where(eq(subscriptions.id, sub.id));
    }

    // 2. Fetch transactions
    const { month, year } = req.query;
    let conditions = [eq(transactions.userId, userId)];

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      conditions.push(gte(transactions.date, start));
      conditions.push(lte(transactions.date, end));
    }

    const results = await db.select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    res.json(results.map(formatTransaction));
  } catch (err) {
    console.error("Get transactions error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const userId = req.user.id;
    let { type, amount, category, date, description } = req.body;
    if (!type || !amount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Smart Auto-Categorization
    if (!category || category.trim() === "Other" || category.trim() === "") {
        if (description) {
            const rules = await db.select().from(categoryRules).where(eq(categoryRules.userId, userId));
            const lowerDesc = description.toLowerCase();
            const matchedRule = rules.find(r => lowerDesc.includes(r.keyword.toLowerCase()));
            if (matchedRule) {
                category = matchedRule.category;
            }
        }
        if (!category || category === "") category = "Other";
    }

    const [inserted] = await db.insert(transactions).values({
      userId,
      type,
      amount: amount.toString(),
      category,
      date: new Date(date),
      description,
    }).returning();

    res.status(201).json(formatTransaction(inserted));
  } catch (err) {
    console.error("Create transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/transactions/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type, amount, category, date, description } = req.body;
    
    const [updated] = await db.update(transactions)
      .set({ 
        type, 
        amount: amount?.toString(), 
        category, 
        date: date ? new Date(date) : undefined, 
        description 
      })
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(formatTransaction(updated));
  } catch (err) {
    console.error("Update transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/transactions/bulk", async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Missing array of ids" });
    }
    
    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

    await db.delete(transactions)
      .where(and(
        inArray(transactions.id, numericIds),
        eq(transactions.userId, userId)
      ));
    
    res.json({ message: "Transactions deleted" });
  } catch (err) {
    console.error("Bulk delete error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [deleted] = await db.delete(transactions)
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/budgets", async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await db.select().from(budgets).where(eq(budgets.userId, userId));
    res.json(results.map(b => ({ ...b, _id: b.id, amount: parseFloat(b.amount) })));
  } catch (err) {
    console.error("Get budgets error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, amount, period } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ message: "Category and amount required" });
    }

    // Upsert logic for Drizzle
    const existing = await db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.category, category))).limit(1);
    
    let result;
    if (existing.length > 0) {
      [result] = await db.update(budgets)
        .set({ amount: amount.toString(), period: period || "monthly" })
        .where(eq(budgets.id, existing[0].id))
        .returning();
    } else {
      [result] = await db.insert(budgets)
        .values({ userId, category, amount: amount.toString(), period: period || "monthly" })
        .returning();
    }

    res.status(201).json({ ...result, _id: result.id, amount: parseFloat(result.amount) });
  } catch (err) {
    console.error("Create budget error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const periodTransactions = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      ));

    const income = periodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = periodTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId));

    const spentByCategory = {};
    periodTransactions.forEach((t) => {
      if (t.type === "expense") {
        spentByCategory[t.category] =
          (spentByCategory[t.category] || 0) + parseFloat(t.amount);
      }
    });

    const budgetSummary = userBudgets.map((b) => ({
      category: b.category,
      budget: parseFloat(b.amount),
      spent: spentByCategory[b.category] || 0,
      remaining: parseFloat(b.amount) - (spentByCategory[b.category] || 0),
    }));

    res.json({
      month: targetMonth + 1,
      year: targetYear,
      income,
      expenses,
      balance: income - expenses,
      budgetSummary,
    });
  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

