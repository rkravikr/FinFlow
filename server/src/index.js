import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import financeRoutes from "./routes/finance.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import goalRoutes from "./routes/goals.js";
import categoryRuleRoutes from "./routes/categoryRules.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.error("DATABASE_URL is missing in environment variables");
  process.exit(1);
}

// Updated CORS to be more flexible for deployment
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development, the specified CLIENT_ORIGIN, and Vercel preview deployments
      if (!origin || origin === CLIENT_ORIGIN || origin.endsWith("vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is reachable" });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "FinFlow API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/category-rules", categoryRuleRoutes);

// Export for Vercel serverless compatibility
export default app;

// Only listen if running directly (not via serverless)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Connected to Neon Postgres via Drizzle");
  });
}

