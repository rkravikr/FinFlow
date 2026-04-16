import React, { useEffect, useState } from "react";
import { useAuthedApi } from "../lib/apiClient";
import { useCurrency } from "../currency/CurrencyContext";

type Subscription = {
  _id: string;
  name: string;
  amount: number;
  category: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextChargeDate: string;
  isActive: boolean;
};

const INITIAL_FORM = {
  name: "",
  amount: "",
  category: "Entertainment",
  frequency: "monthly",
  nextChargeDate: new Date().toISOString().slice(0, 10),
};

export function SubscriptionsPage() {
  const api = useAuthedApi();
  const { formatMoney } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState(INITIAL_FORM);

  const loadData = async () => {
    try {
      setError(null);
      const res = await api.get("/subscriptions");
      setSubscriptions(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post("/subscriptions", {
        name: form.name,
        amount: Number(form.amount),
        category: form.category,
        frequency: form.frequency,
        nextChargeDate: form.nextChargeDate,
      });
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this subscription?")) return;
    try {
      await api.del(`/subscriptions/${id}`);
      await loadData();
    } catch (err: unknown) {
      setError("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Subscriptions & Recurring
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We will automatically add these expenses to your transactions on their charge date.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add Subscription Form */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Add Subscription</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Name (e.g. Netflix)"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100 sm:col-span-2 lg:col-span-1"
          />
          <input
            type="number"
            placeholder="Amount"
            required
            min={0}
            step={0.01}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <input
            type="text"
            placeholder="Category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input
            type="date"
            required
            value={form.nextChargeDate}
            onChange={(e) => setForm({ ...form, nextChargeDate: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Render Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 col-span-3">No active subscriptions found.</p>
        ) : (
          subscriptions.map(sub => (
            <div key={sub._id} className="glass-card p-6 border-t-4 border-t-primary flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white capitalize">{sub.name}</h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">{sub.category}</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-4">{formatMoney(sub.amount)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                     Billed {sub.frequency}
                  </p>
               </div>
               
               <div className="flex items-center justify-between mt-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Next charge: <span className="text-slate-900 dark:text-slate-100">{new Date(sub.nextChargeDate).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDelete(sub._id)} className="text-rose-500 hover:text-rose-600 text-sm font-medium">Cancel</button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
