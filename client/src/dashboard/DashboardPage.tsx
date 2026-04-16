import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthedApi } from "../lib/apiClient";
import type { Summary, Transaction } from "../types/finance";

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

export function DashboardPage() {
  const api = useAuthedApi();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

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
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  // Build chart data: last 6 months income/expense
  const chartData = (() => {
    const data: { name: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      data.push({
        name: `${MONTHS[m - 1]} ${y}`,
        income: 0,
        expenses: 0,
      });
    }
    return data;
  })();

  // Populate chart from summary (simplified: only current month in last slot)
  if (summary) {
    const last = chartData[chartData.length - 1];
    if (last) {
      last.income = summary.income;
      last.expenses = summary.expenses;
    }
  }

  const categoryBreakdown = summary?.budgetSummary ?? [];
  const recentTx = transactions.slice(0, 8);

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
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 hover:shadow-soft dark:hover:shadow-soft-dark transition-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total balance
          </p>
          <p className="mt-2 text-2xl font-display font-semibold text-slate-900 dark:text-white">
            ₹{(summary?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card p-6 hover:shadow-soft dark:hover:shadow-soft-dark transition-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Income
          </p>
          <p className="mt-2 text-2xl font-display font-semibold text-emerald-600 dark:text-emerald-400">
            ₹{(summary?.income ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card p-6 hover:shadow-soft dark:hover:shadow-soft-dark transition-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Expenses
          </p>
          <p className="mt-2 text-2xl font-display font-semibold text-rose-600 dark:text-rose-400">
            ₹{(summary?.expenses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Monthly spending chart */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
          Monthly overview
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: number | undefined) => [`₹${(value ?? 0).toFixed(2)}`, ""]}
                contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)" }}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
            Category-wise expenses
          </h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No budget categories yet.</p>
          ) : (
            <ul className="space-y-4">
              {categoryBreakdown.map((b) => {
                const pct = b.budget > 0 ? Math.min(100, (b.spent / b.budget) * 100) : 0;
                const over = b.spent > b.budget;
                return (
                  <li key={b.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                      <span className={over ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}>
                        ₹{b.spent.toFixed(0)} / ₹{b.budget.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${over ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent transactions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">
              Recent transactions
            </h2>
            <Link
              to="/transactions"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No transactions this month.</p>
          ) : (
            <ul className="space-y-3">
              {recentTx.map((t) => (
                <li
                  key={t._id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{t.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(t.date).toLocaleDateString()}
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                  <span
                    className={
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-rose-600 dark:text-rose-400 font-semibold"
                    }
                  >
                    {t.type === "income" ? "+" : "-"}₹{t.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
