import { apiRequest } from "./api-client";

export interface GameParticipant {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
}

export interface GamePayload {
  organiser_id: string;
  name: string;
  venue: string;
  city_slug: string;
  sport_code: string;
  date: string;
  start_time: string;
  end_time: string;
  skill: string;
  gender: string;
  players: number;
  description?: string | null;
  rules?: string | null;
  frequency: "one-off" | "recurring";
  price?: number | null;
  is_private: boolean;
  cancellation: string;
  team_sheet: boolean;
  participant_user_ids?: string[];
  created_by_user_id?: string | null;
  status?: "pending" | "confirmed" | "unapproved" | "completed";
}

export interface GameResponse extends GamePayload {
  id: string;
  created_by_user_id: string | null;
  participant_user_ids: string[];
  participants: GameParticipant[];
  status: "pending" | "confirmed" | "unapproved" | "completed";
  created_at: string;
  updated_at: string;
}

export function createGame(payload: GamePayload): Promise<GameResponse> {
  return apiRequest<GameResponse>("/games/", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export function listGames(limit = 50): Promise<GameResponse[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiRequest<GameResponse[]>(`/games/?${params.toString()}`, {
    method: "GET",
  });
}

export function getGame(id: string): Promise<GameResponse> {
  return apiRequest<GameResponse>(`/games/${id}`, {
    method: "GET",
  });
}

export function joinGame(id: string): Promise<GameResponse> {
  return apiRequest<GameResponse>(`/games/${id}/join`, {
    method: "POST",
    auth: true,
  });
}
