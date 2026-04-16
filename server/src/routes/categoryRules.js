import express from "express";
import { db } from "../db/index.js";
import { categoryRules } from "../db/schema.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { eq, and } from "drizzle-orm";

const router = express.Router();
router.use(authRequired);

const formatRule = (r) => ({
  ...r,
  _id: r.id,
});

router.get("/", async (req, res) => {
  try {
    const results = await db.select()
      .from(categoryRules)
      .where(eq(categoryRules.userId, req.user.id));
    res.json(results.map(formatRule));
  } catch (err) {
    console.error("Get rules error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { keyword, category } = req.body;
    if (!keyword || !category) return res.status(400).json({ message: "Missing fields" });
    
    const [rule] = await db.insert(categoryRules).values({
      userId: req.user.id,
      keyword: keyword.toLowerCase(),
      category,
    }).returning();

    res.status(201).json(formatRule(rule));
  } catch (err) {
    console.error("Create rule error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db.delete(categoryRules)
      .where(and(
        eq(categoryRules.id, parseInt(req.params.id)), 
        eq(categoryRules.userId, req.user.id)
      ))
      .returning();

    if (!deleted) return res.status(404).json({ message: "Rule not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete rule error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
