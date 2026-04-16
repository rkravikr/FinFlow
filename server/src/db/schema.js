import { pgTable, serial, text, decimal, timestamp, boolean, varchar, integer, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["daily", "weekly", "monthly", "yearly"]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  baseCurrency: varchar("base_currency", { length: 10 }).default("INR"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // e.g. "2024-04"
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  deadline: timestamp("deadline"),
  color: varchar("color", { length: 20 }).default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  frequency: subscriptionFrequencyEnum("frequency").notNull(),
  nextChargeDate: timestamp("next_charge_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoryRules = pgTable("category_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
