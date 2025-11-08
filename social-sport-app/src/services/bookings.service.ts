import { apiRequest } from "./api-client";

export interface BookingResponse {
  id: string;
  game_id: string;
  user_id: string;
  joined_at: string;
  notes: string | null;
}

export interface JoinGamePayload {
  notes?: string | null;
}

export interface BookingParticipant {
  booking_id: string;
  user: {
    id: string;
    name?: string | null;
    avatar_url?: string | null;
  };
  joined_at: string;
}

export interface BookingGame {
  id: string;
  name: string;
  venue: string;
  city_slug: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  sport_code: string;
}

export interface GameWithBooking {
  game: BookingGame;
  booking: BookingResponse;
  participants_count: number;
}

export function joinGame(gameId: string, payload: JoinGamePayload = {}): Promise<BookingResponse> {
  return apiRequest<BookingResponse>(`/games/${gameId}/join`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      game_id: gameId,
      notes: payload.notes ?? null,
    }),
  });
}

export function cancelBooking(bookingId: string): Promise<BookingResponse> {
  return apiRequest<BookingResponse>(`/bookings/${bookingId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function getGameParticipants(gameId: string): Promise<BookingParticipant[]> {
  return apiRequest<BookingParticipant[]>(`/games/${gameId}/participants`, {
    method: "GET",
    auth: true,
  });
}

export function getMyGames(): Promise<GameWithBooking[]> {
  return apiRequest<GameWithBooking[]>("/users/me/games", {
    method: "GET",
    auth: true,
  });
}
