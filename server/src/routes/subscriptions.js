import express from "express";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { eq, and, desc } from "drizzle-orm";

const router = express.Router();
router.use(authRequired);

const formatSub = (s) => ({
  ...s,
  _id: s.id,
  amount: parseFloat(s.amount),
});

// Get all subscriptions for user
router.get("/", async (req, res) => {
  try {
    const results = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, req.user.id))
      .orderBy(desc(subscriptions.createdAt));
    
    res.json(results.map(formatSub));
  } catch (err) {
    console.error("Get subs error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Create subscription
router.post("/", async (req, res) => {
  try {
    const { name, amount, category, frequency, nextChargeDate } = req.body;
    
    if (!name || isNaN(amount) || !category || !frequency || !nextChargeDate) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const [sub] = await db.insert(subscriptions).values({
      userId: req.user.id,
      name,
      amount: amount.toString(),
      category,
      frequency,
      nextChargeDate: new Date(nextChargeDate),
    }).returning();

    res.status(201).json(formatSub(sub));
  } catch (err) {
    console.error("Create sub error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete subscription
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db.delete(subscriptions)
      .where(and(
        eq(subscriptions.id, parseInt(req.params.id)), 
        eq(subscriptions.userId, req.user.id)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json({ message: "Subscription deleted" });
  } catch (err) {
    console.error("Delete sub error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
