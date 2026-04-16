import { useAuth } from "../auth/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = {
  async request(
    path: string,
    options: RequestInit & { authToken?: string } = {}
  ) {
    const url = `${API_BASE_URL}${path}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (options.authToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${options.authToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  },

  async get(path: string, authToken?: string) {
    return this.request(path, { method: "GET", authToken });
  },

  async post(path: string, body: unknown, authToken?: string) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
      authToken,
    });
  },

  async put(path: string, body: unknown, authToken?: string) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
      authToken,
    });
  },

  async del(path: string, authToken?: string) {
    return this.request(path, { method: "DELETE", authToken });
  },
};

export const useAuthedApi = () => {
  const { token } = useAuth();
  return {
    get: (path: string) => apiClient.get(path, token || undefined),
    post: (path: string, body: unknown) =>
      apiClient.post(path, body, token || undefined),
    put: (path: string, body: unknown) =>
      apiClient.put(path, body, token || undefined),
    del: (path: string) => apiClient.del(path, token || undefined),
  };
};

