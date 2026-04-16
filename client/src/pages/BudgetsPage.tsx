import { useEffect, useMemo, useState } from "react";
import { useAuthedApi } from "../lib/apiClient";
import type { Summary } from "../types/finance";

export function BudgetsPage() {
  const api = useAuthedApi();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "", amount: "" });
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const loadData = async () => {
    try {
      setError(null);
      const [_, summaryRes] = await Promise.all([
        api.get("/finance/budgets"),
        api.get(`/finance/summary?month=${month}&year=${year}`),
      ]);
      setSummary(summaryRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const budgetSummary = summary?.budgetSummary ?? [];
  const exceeded = useMemo(
    () => budgetSummary.filter((b) => b.spent > b.budget),
    [budgetSummary]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post("/finance/budgets", {
        category: form.category,
        amount: Number(form.amount),
      });
      setForm({ category: "", amount: "" });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Budgets
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set monthly limits and track spending by category
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

      {exceeded.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-rose-500 bg-rose-50/50 dark:bg-rose-900/10">
          <p className="font-medium text-rose-800 dark:text-rose-200">
            Budget exceeded for: {exceeded.map((b) => b.category).join(", ")}
          </p>
          <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
            Consider adjusting your budget or reducing spending in these categories.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="glass-card p-8 text-center text-slate-500">Loading...</div>
          ) : budgetSummary.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500 dark:text-slate-400">
              No budgets set. Create one below to track spending.
            </div>
          ) : (
            budgetSummary.map((b) => {
              const pct = b.budget > 0 ? Math.min(100, (b.spent / b.budget) * 100) : 0;
              const over = b.spent > b.budget;
              return (
                <div key={b.category} className="glass-card p-6 hover:shadow-soft dark:hover:shadow-soft-dark transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-slate-900 dark:text-white">
                      {b.category}
                    </h3>
                    <span
                      className={`text-sm font-medium ${over ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      ₹{b.spent.toLocaleString()} / ₹{b.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${over ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  {over && (
                    <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                      Over by ₹{(b.spent - b.budget).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
              Set monthly budget
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food, Transport"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹/month)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-sm transition-colors"
              >
                Save budget
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
