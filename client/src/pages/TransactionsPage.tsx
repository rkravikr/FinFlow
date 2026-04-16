import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuthedApi } from "../lib/apiClient";
import type { Transaction } from "../types/finance";
import { useCurrency } from "../currency/CurrencyContext";
import Papa from "papaparse";
import Tesseract from "tesseract.js";

const CATEGORY_SUGGESTIONS = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Travel", "Salary", "Freelance", "Other",
];

const INITIAL_FORM_STATE = {
  type: "expense" as "income" | "expense",
  amount: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

export function TransactionsPage() {
  const api = useAuthedApi();
  const { formatMoney } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  
  // Selection & Actions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Processing States
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setError(null);
      const res = await api.get("/finance/transactions");
      setTransactions(res);
      setSelectedIds([]); // Clear selection on reload
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (filterType === "income") list = list.filter((t) => t.type === "income");
    if (filterType === "expense") list = list.filter((t) => t.type === "expense");
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);
    if (filterDateFrom) list = list.filter((t) => t.date >= filterDateFrom);
    if (filterDateTo) list = list.filter((t) => t.date <= filterDateTo);
    return list;
  }, [transactions, filterType, filterCategory, filterDateFrom, filterDateTo]);

  // Bulk Select Hooks
  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map(t => t._id));
  };
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        description: form.description || undefined,
      };
      if (editingId) {
        await api.put(`/finance/transactions/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post("/finance/transactions", payload);
      }
      setForm(INITIAL_FORM_STATE);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t._id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      date: new Date(t.date).toISOString().slice(0, 10),
      description: t.description || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      setError(null);
      await api.del(`/finance/transactions/${id}`);
      if (editingId === id) setEditingId(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} transactions?`)) return;
    try {
      setError(null);
      setLoading(true);
      await api.post("/finance/transactions/bulk", { ids: selectedIds }); // Wait, API is robust to DELETE with body sometimes failing, we didn't add bulk post, we added router.delete. Fetch API handles deleting with body correctly in our apiClient? Actually apiClient.del doesn't pass body. Let's use request directly.
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const authToken = localStorage.getItem("finflow-auth");
      if (authToken) headers["Authorization"] = `Bearer ${JSON.parse(authToken).token}`;
      
      await fetch(import.meta.env.VITE_API_BASE_URL + "/finance/transactions/bulk", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ ids: selectedIds }),
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM_STATE);
  };

  // CSV Export
  const exportCSV = () => {
    if (filtered.length === 0) return alert("No data to export");
    const data = filtered.map(t => ({
      Date: new Date(t.date).toISOString().slice(0, 10),
      Type: t.type,
      Amount: t.amount,
      Category: t.category,
      Description: t.description || ""
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // CSV Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          for (const row of rows) {
            const payload = {
              type: row.Type?.toLowerCase().includes("income") ? "income" : "expense",
              amount: parseFloat(row.Amount) || 0,
              category: row.Category || "Other",
              date: row.Date ? new Date(row.Date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              description: row.Description || undefined,
            };
            if (payload.amount > 0) {
              await api.post("/finance/transactions", payload);
            }
          }
          await loadData();
          alert("Import successful!");
        } catch (err: any) {
          setError("Failed during import: " + err.message);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    });
  };

  // Scan Receipt (OCR)
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsScanning(true);
      const worker = await Tesseract.createWorker("eng");
      const ret = await worker.recognize(file);
      await worker.terminate();

      // Basic regex to find the largest currency number (Amount)
      const text = ret.data.text;
      const numberPattern = /\b\d{1,5}(?:[.,]\d{2})\b/g;
      const matches = text.match(numberPattern);
      let highestAmt = 0;
      if (matches) {
        matches.forEach(m => {
          const num = parseFloat(m.replace(",", "."));
          if (num > highestAmt) highestAmt = num;
        });
      }

      setForm(prev => ({
        ...prev,
        amount: highestAmt > 0 ? String(highestAmt) : "",
        description: "Scanned Receipt",
      }));
      alert(highestAmt > 0 ? `Scanned amount: ${highestAmt}` : "Could not find amount on receipt.");
    } catch (err) {
      alert("Failed to scan receipt");
      console.error(err);
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage, filter, export and scan your transactions.
          </p>
        </div>
        <div className="flex gap-2">
           <input type="file" accept="image/*" className="hidden" id="scan-btn" onChange={handleScanReceipt} />
           <label htmlFor="scan-btn" className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-soft">
             {isScanning ? "Scanning..." : "📷 Scan Receipt"}
           </label>

           <input type="file" accept=".csv" className="hidden" id="import-btn" ref={fileInputRef} onChange={handleCSVImport} />
           <label htmlFor="import-btn" className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 text-sm font-medium transition-colors">
             {isImporting ? "Importing..." : "⬇️ Import CSV"}
           </label>

           <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 text-sm font-medium transition-colors">
             ⬆️ Export CSV
           </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
          {editingId ? "Edit transaction" : "Add transaction"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            required
            min={0}
            step={0.01}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            list="cat-list"
            placeholder="Category (Auto-sets if blank)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <datalist id="cat-list">
            {[...categories, ...CATEGORY_SUGGESTIONS].filter((c, i, a) => a.indexOf(c) === i).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <input
            type="text"
            placeholder="Description for receipt or auto-categorize"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent sm:col-span-2 lg:col-span-1"
          />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              {editingId ? "Update" : "Add Details"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters & Bulk Operations */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filters:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-3 py-1.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-3 py-1.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-3 py-1.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-3 py-1.5 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
          >
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-4 px-6 w-12">
                   <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-transparent" />
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                <th className="text-right py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                <th className="text-right py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">No transactions match your filters.</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                       <input type="checkbox" checked={selectedIds.includes(t._id)} onChange={() => toggleSelect(t._id)} className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-transparent" />
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                          t.type === "income"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800 dark:text-slate-200">{t.category}</td>
                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{t.description || "—"}</td>
                    <td className="py-4 px-6 text-right font-semibold">
                      <span className={t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {t.type === "income" ? "+" : "-"}{formatMoney(t.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        className="text-blue-600 dark:text-sky-400 hover:underline text-sm font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t._id)}
                        className="text-rose-600 dark:text-rose-400 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
