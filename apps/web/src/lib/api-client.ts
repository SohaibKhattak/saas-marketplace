const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const newToken = json.data?.accessToken;
      if (newToken) {
        // Update in-memory store
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.setState({ accessToken: newToken });
      }
      return newToken ?? null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders as Record<string, string>,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  // On 401, try refreshing the token and retry once
  if (res.status === 401 && token && !endpoint.includes("/auth/refresh")) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
      const retryJson = await retryRes.json().catch(() => ({}));
      if (!retryRes.ok) {
        throw new ApiError(
          retryRes.status,
          retryJson.error?.code ?? "UNKNOWN_ERROR",
          retryJson.error?.message ?? "An error occurred",
          retryJson.error?.details
        );
      }
      return retryJson;
    }

    // Refresh failed — redirect to login
    if (typeof window !== "undefined") {
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An error occurred",
      json.error?.details
    );
  }

  return json;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export { ApiError };
