export type Transaction = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description?: string;
};

export type Budget = {
  _id: string;
  category: string;
  amount: number;
};

export type Summary = {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  budgetSummary: {
    category: string;
    budget: number;
    spent: number;
    remaining: number;
  }[];
};
