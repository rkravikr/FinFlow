import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Manual password hashing (replacing Mongoose pre-save hooks)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [user] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email
    });

    const token = createToken(user.id);

    res.status(201).json({
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    const message = process.env.NODE_ENV !== "production" ? err.message : "Server error";
    res.status(500).json({ message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Manual password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    const message = process.env.NODE_ENV !== "production" ? err.message : "Server error";
    res.status(500).json({ message });
  }
});

export default router;

