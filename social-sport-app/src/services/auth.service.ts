import { apiRequest, setStoredTokens, clearStoredTokens } from "./api-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
  preferredCity?: string | null;
  heardAbout?: string | null;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
    created_at?: string | null;
    preferred_city?: string | null;
    heard_about?: string | null;
  };
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  preferredCity?: string | null;
  heardAbout?: string | null;
}

export async function signup(payload: SignupPayload): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      preferred_city: payload.preferredCity ?? null,
      heard_about: payload.heardAbout ?? null,
    }),
  });
  setStoredTokens(response.access_token, response.refresh_token);
  return mapUser(response.user);
}

export async function login(payload: { email: string; password: string }): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredTokens(response.access_token, response.refresh_token);
  return mapUser(response.user);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const user = await apiRequest<AuthResponse["user"]>("/auth/me", { auth: true });
  return mapUser(user);
}

export function logout() {
  clearStoredTokens();
}

function mapUser(user: AuthResponse["user"]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url ?? undefined,
    createdAt: user.created_at ?? undefined,
    preferredCity: user.preferred_city ?? undefined,
    heardAbout: user.heard_about ?? undefined,
  };
}
