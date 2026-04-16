

type CategoryRow = {
  name: string;
  type: "expense" | "income";
  color: string;
};

const MOCK_CATEGORIES: CategoryRow[] = [
  { name: "Salary", type: "income", color: "#10b981" },
  { name: "Freelance", type: "income", color: "#22c55e" },
  { name: "Food", type: "expense", color: "#f97316" },
  { name: "Transport", type: "expense", color: "#3b82f6" },
  { name: "Entertainment", type: "expense", color: "#a855f7" },
];

export function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Categories
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Organize how your transactions are grouped.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Default categories
          </p>
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 transition-colors"
          >
            + New category
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Type
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Color
              </th>
              <th className="text-right py-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CATEGORIES.map((c) => (
              <tr
                key={c.name}
                className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3 px-6 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {c.name}
                </td>
                <td className="py-3 px-6 text-sm">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                      c.type === "income"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {c.type === "income" ? "Income" : "Expense"}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.color}
                  </div>
                </td>
                <td className="py-3 px-6 text-right text-sm">
                  <button
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

