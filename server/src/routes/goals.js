import express from "express";
import { db } from "../db/index.js";
import { goals } from "../db/schema.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { eq, and, desc } from "drizzle-orm";

const router = express.Router();
router.use(authRequired);

const formatGoal = (g) => ({
  ...g,
  _id: g.id,
  targetAmount: parseFloat(g.targetAmount),
  currentAmount: parseFloat(g.currentAmount),
});

router.get("/", async (req, res) => {
  try {
    const results = await db.select()
      .from(goals)
      .where(eq(goals.userId, req.user.id))
      .orderBy(desc(goals.createdAt));
    res.json(results.map(formatGoal));
  } catch (err) {
    console.error("Get goals error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, color } = req.body;
    if (!name || isNaN(targetAmount)) {
      return res.status(400).json({ message: "Invalid fields" });
    }
    
    const [goal] = await db.insert(goals).values({
      userId: req.user.id,
      name,
      targetAmount: targetAmount.toString(),
      currentAmount: currentAmount ? currentAmount.toString() : "0",
      deadline: deadline ? new Date(deadline) : null,
      color,
    }).returning();

    res.status(201).json(formatGoal(goal));
  } catch (err) {
    console.error("Create goal error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { currentAmount } = req.body;
    if (isNaN(currentAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }
    
    const [goal] = await db.update(goals)
      .set({ currentAmount: currentAmount.toString() })
      .where(and(
        eq(goals.id, parseInt(req.params.id)), 
        eq(goals.userId, req.user.id)
      ))
      .returning();
    
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(formatGoal(goal));
  } catch (err) {
    console.error("Update goal error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db.delete(goals)
      .where(and(
        eq(goals.id, parseInt(req.params.id)), 
        eq(goals.userId, req.user.id)
      ))
      .returning();

    if (!deleted) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete goal error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
