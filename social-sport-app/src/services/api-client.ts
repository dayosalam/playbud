const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5173/api";

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

const ACCESS_TOKEN_KEY = "pb_access_token";

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("pb_access_token", accessToken);
  localStorage.setItem("pb_refresh_token", refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem("pb_access_token");
  localStorage.removeItem("pb_refresh_token");
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = getStoredAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || data.message || JSON.stringify(data);
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
