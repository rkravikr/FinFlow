import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { CurrencyProvider } from "./currency/CurrencyContext";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./dashboard/DashboardPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/ProfilePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { GoalsPage } from "./pages/GoalsPage";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </ThemeProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
