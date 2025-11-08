import { apiRequest } from "./api-client";

export interface ReferenceCity {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

export interface ReferenceLookupItem {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
}

export interface ReferenceDataResponse {
  cities: ReferenceCity[];
  sports: ReferenceLookupItem[];
  abilities: ReferenceLookupItem[];
  genders: ReferenceLookupItem[];
}

export function fetchReferenceData(): Promise<ReferenceDataResponse> {
  return apiRequest<ReferenceDataResponse>("/reference-data");
}
