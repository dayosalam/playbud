import { apiRequest } from "./api-client";
import type { GameResponse } from "./games.service";
import type { Organizer } from "./organizers.service";
import type { BookingParticipant } from "./bookings.service";

export type GameStatus = "pending" | "confirmed" | "unapproved" | "completed";

export interface AdminUserInfo {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  preferred_city?: string | null;
  heard_about?: string | null;
  organiser_id?: string | null;
  created_at?: string | null;
}

export interface AdminGameDetail {
  game: GameResponse;
  creator: AdminUserInfo | null;
  organizer: Organizer | null;
  participants: BookingParticipant[];
}

export async function fetchAllGames(status?: GameStatus): Promise<GameResponse[]> {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  const query = params.toString();
  return apiRequest<GameResponse[]>(`/admin/games${query ? `?${query}` : ""}`, {
    method: "GET",
    auth: true,
  });
}

export async function updateGameStatus(gameId: string, status: GameStatus): Promise<GameResponse> {
  return apiRequest<GameResponse>(`/admin/games/${gameId}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function fetchGameDetail(gameId: string): Promise<AdminGameDetail> {
  return apiRequest<AdminGameDetail>(`/admin/games/${gameId}`, {
    method: "GET",
    auth: true,
  });
}
