import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
          Account
        </h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Name
            </dt>
            <dd className="mt-1 text-slate-900 dark:text-white font-medium">{user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email
            </dt>
            <dd className="mt-1 text-slate-900 dark:text-white font-medium">{user?.email ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
          Appearance
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Choose light or dark theme for the app.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all ${
              theme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all ${
              theme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
