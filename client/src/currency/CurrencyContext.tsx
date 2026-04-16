import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { useAuthedApi } from "../lib/apiClient";

type CurrencyContextType = {
  currency: string;
  setCurrency: (code: string) => Promise<void>;
  exchangeRate: number; // 1 if loading/base, or the multiplier to convert INR -> Currency
  formatMoney: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const api = useAuthedApi();
  const [currency, setCurrencyState] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1);

  // We load the base currency from the backend if possible.
  useEffect(() => {
    // If the backend returned a baseCurrency on the user object, use it here.
    // For now we'll fetch the user profile if needed, or assume the user object has it.
    // Assuming we fetch it on mount
    const fetchUserCurrency = async () => {
      try {
        if (!user) return;
        const res = await api.get("/auth/me"); // Assuming we have an endpoint like this, or we can just read it if it exists.
        if (res.baseCurrency) {
          setCurrencyState(res.baseCurrency);
        }
      } catch (err) {
        console.error("Failed to fetch user currency", err);
      }
    };
    if (user) {
      fetchUserCurrency();
    }
  }, [user]);

  // When currency changes, fetch the exchange rate
  useEffect(() => {
    const loadExchangeRate = async () => {
      if (currency === "INR") {
        setExchangeRate(1);
        return;
      }
      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${currency}`);
        const data = await res.json();
        if (data && data.rates && data.rates[currency]) {
          setExchangeRate(data.rates[currency]);
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
        setExchangeRate(1); // fallback
      }
    };
    loadExchangeRate();
  }, [currency]);

  const setCurrency = async (code: string) => {
    setCurrencyState(code);
    if (user) {
      // Save it to the backend
      try {
        await api.put("/auth/settings", { baseCurrency: code });
      } catch (err) {
        console.error("Failed to save currency setting", err);
      }
    }
  };

  const formatMoney = (amount: number) => {
    const converted = amount * exchangeRate;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
