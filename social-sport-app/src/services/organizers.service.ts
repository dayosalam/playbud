import { apiRequest } from "./api-client";

export interface Organizer {
  id: string;
  user_id: string;
  slug?: string | null;
  sports: string[];
  experience?: string | null;
  unique_link?: string | null;
  game_ids: string[];
  created_at: string;
}

export interface OrganizerPayload {
  user_id: string;
  slug?: string | null;
  sports?: string[];
  experience?: string | null;
  unique_link?: string | null;
}

export async function ensureOrganizer(payload: OrganizerPayload): Promise<Organizer> {
  return apiRequest<Organizer>("/organizers/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getMyOrganizer(): Promise<Organizer> {
  return apiRequest<Organizer>("/organizers/me", { auth: true });
}
