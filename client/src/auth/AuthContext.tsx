import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "finflow-auth";

const getInitialAuth = () => {
  if (typeof window === "undefined") return { user: null, token: null };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as { user: User; token: string };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  return { user: null, token: null };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getInitialAuth().user);
  const [token, setToken] = useState<string | null>(() => getInitialAuth().token);

  const login = (newToken: string, newUser: User) => {
    setUser(newUser);
    setToken(newToken);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: newUser, token: newToken })
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

