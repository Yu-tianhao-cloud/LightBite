// frontend/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private tokenCache: string | null = null;

  setToken(token: string | null) {
    this.tokenCache = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  private getToken(): string | null {
    if (this.tokenCache) return this.tokenCache;
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("token");
    if (stored) this.tokenCache = stored; // restore from localStorage on page refresh
    return stored;
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (res.status === 401 && typeof window !== "undefined") {
      this.setToken(null);
      if (path !== "/auth/me") {
        window.location.href = "/login";
      }
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  get(path: string) { return this.fetch(path); }
  post(path: string, body: any) { return this.fetch(path, { method: "POST", body: JSON.stringify(body) }); }
  put(path: string, body: any) { return this.fetch(path, { method: "PUT", body: JSON.stringify(body) }); }
  delete(path: string) { return this.fetch(path, { method: "DELETE" }); }
}

export const api = new ApiClient();
