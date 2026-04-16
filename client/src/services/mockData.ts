import type { Transaction, Budget, Summary } from "../types/finance";

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    _id: "t1",
    type: "income",
    amount: 85000,
    category: "Salary",
    date: new Date().toISOString(),
    description: "Monthly salary",
  },
  {
    _id: "t2",
    type: "expense",
    amount: 3500,
    category: "Food",
    date: new Date().toISOString(),
    description: "Groceries",
  },
  {
    _id: "t3",
    type: "expense",
    amount: 1200,
    category: "Transport",
    date: new Date().toISOString(),
    description: "Metro card",
  },
  {
    _id: "t4",
    type: "expense",
    amount: 4200,
    category: "Rent",
    date: new Date().toISOString(),
    description: "Shared apartment",
  },
];

export const MOCK_BUDGETS: Budget[] = [
  { _id: "b1", category: "Food", amount: 10000 },
  { _id: "b2", category: "Transport", amount: 4000 },
  { _id: "b3", category: "Entertainment", amount: 5000 },
  { _id: "b4", category: "Rent", amount: 20000 },
];

export const MOCK_SUMMARY: Summary = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  income: 85000,
  expenses: 28000,
  balance: 85000 - 28000,
  budgetSummary: MOCK_BUDGETS.map((b) => {
    const spent = MOCK_TRANSACTIONS.filter(
      (t) => t.type === "expense" && t.category === b.category
    ).reduce((sum, t) => sum + t.amount, 0);
    return {
      category: b.category,
      budget: b.amount,
      spent,
      remaining: b.amount - spent,
    };
  }),
};

