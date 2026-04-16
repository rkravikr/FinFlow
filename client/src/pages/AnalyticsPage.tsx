import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthedApi } from "../lib/apiClient";
import type { Summary, Transaction } from "../types/finance";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function AnalyticsPage() {
  const api = useAuthedApi();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const loadData = async () => {
    try {
      setError(null);
      const [summaryRes, txRes] = await Promise.all([
        api.get(`/finance/summary?month=${month}&year=${year}`),
        api.get(`/finance/transactions?month=${month}&year=${year}`),
      ]);
      setSummary(summaryRes);
      setTransactions(txRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const expenseByCategory = (() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const incomeVsExpense = [
    { name: "Income", amount: summary?.income ?? 0, fill: "#10b981" },
    { name: "Expenses", amount: summary?.expenses ?? 0, fill: "#ef4444" },
  ];

  const trendInsight = (() => {
    const balance = summary?.balance ?? 0;
    const income = summary?.income ?? 0;
    const expenses = summary?.expenses ?? 0;
    if (income === 0 && expenses === 0)
      return { text: "Add transactions to see insights.", type: "muted" as const };
    if (balance >= 0 && income > 0)
      return {
        text: `You're saving ₹${balance.toLocaleString()} this month. ${expenses > 0 ? `Spending is ${((expenses / income) * 100).toFixed(0)}% of income.` : ""}`,
        type: "positive" as const,
      };
    if (balance < 0)
      return {
        text: `Expenses exceed income by ₹${Math.abs(balance).toLocaleString()} this month. Consider reducing spending or adding income.`,
        type: "warning" as const,
      };
    return { text: "Keep tracking to build better habits.", type: "muted" as const };
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Spending insights and trends
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {trendInsight.text}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Trend insight for {new Date(2000, month - 1).toLocaleString("default", { month: "long" })} {year}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
            Income vs Expenses
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpense} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, ""]} />
                <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
            Spending by category
          </h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              No expense data this month.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: any) => `${props.name || ""} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
