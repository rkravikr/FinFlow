import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    
    // Query Drizzle for the user, excluding the password field
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      baseCurrency: users.baseCurrency
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

    const user = result[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

