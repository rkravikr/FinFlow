import React, { useEffect, useState } from "react";
import { useAuthedApi } from "../lib/apiClient";
import { useCurrency } from "../currency/CurrencyContext";

type Goal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
};

const INITIAL_FORM = {
  name: "",
  targetAmount: "",
  deadline: "",
  color: "#38bdf8",
};

export function GoalsPage() {
  const api = useAuthedApi();
  const { formatMoney } = useCurrency();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState(INITIAL_FORM);
  const [addAmount, setAddAmount] = useState<{ [key: string]: string }>({});

  const loadData = async () => {
    try {
      setError(null);
      const res = await api.get("/goals");
      setGoals(res);
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
      await api.post("/goals", {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        deadline: form.deadline || undefined,
        color: form.color,
      });
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleContribute = async (goal: Goal) => {
    const toAdd = Number(addAmount[goal._id]);
    if (!toAdd || toAdd <= 0) return;
    
    try {
      const newAmount = goal.currentAmount + toAdd;
      await api.put(`/goals/${goal._id}`, { currentAmount: newAmount });
      setAddAmount(prev => ({ ...prev, [goal._id]: "" }));
      await loadData();
    } catch (err) {
      setError("Failed to update goal");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this savings goal?")) return;
    try {
      await api.del(`/goals/${id}`);
      await loadData();
    } catch (err: unknown) {
      setError("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your progress towards life milestones.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add Goal Form */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Create New Goal</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Goal Name (e.g. New Car)"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100 sm:col-span-2 lg:col-span-1"
          />
          <input
            type="number"
            placeholder="Target Amount"
            required
            min={1}
            step={0.01}
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <input
            type="date"
            placeholder="Deadline"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <div className="flex items-center gap-2">
            <input
               type="color"
               value={form.color}
               onChange={(e) => setForm({...form, color: e.target.value})}
               className="h-10 w-12 rounded bg-transparent p-1 cursor-pointer"
            />
            <span className="text-sm text-slate-500">Pick color</span>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
          >
            Create Goal
          </button>
        </form>
      </div>

      {/* Render Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 lg:col-span-2">You haven't set any savings goals yet.</p>
        ) : (
          goals.map(goal => {
             const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
             return (
              <div key={goal._id} className="glass-card p-6 flex flex-col justify-between" style={{ borderTopWidth: '4px', borderColor: goal.color }}>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white capitalize">{goal.name}</h3>
                      {goal.deadline && (
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                           Target: {new Date(goal.deadline).toLocaleDateString()}
                         </p>
                      )}
                   </div>
                   <button onClick={() => handleDelete(goal._id)} className="text-rose-500 hover:text-rose-600 text-sm font-medium">Delete</button>
                </div>

                <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{formatMoney(goal.currentAmount)}</span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ {formatMoney(goal.targetAmount)}</span>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                           style={{ width: `${percent}%`, backgroundColor: goal.color }}></div>
                   </div>
                   <div className="mt-2 text-right text-xs font-semibold" style={{ color: goal.color }}>
                      {percent}% Reached
                   </div>
                </div>

                {/* Contribute Box */}
                <div className="flex items-center gap-3">
                   <input 
                      type="number"
                      min={0}
                      placeholder="Amount to add"
                      value={addAmount[goal._id] || ""}
                      onChange={(e) => setAddAmount({...addAmount, [goal._id]: e.target.value})}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm outline-none text-slate-900 dark:text-slate-100"
                   />
                   <button 
                     onClick={() => handleContribute(goal)}
                     className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                     style={{ backgroundColor: goal.color }}
                   >
                     Add Funds
                   </button>
                </div>
              </div>
             )
          })
        )}
      </div>
    </div>
  );
}
