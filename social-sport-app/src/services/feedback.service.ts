import { apiRequest } from "./api-client";

export interface FeedbackPayload {
  name: string;
  email: string;
  rating: number;
  message: string;
}

export interface FeedbackResponse extends FeedbackPayload {
  id: string;
  created_at: string;
}

export function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  return apiRequest<FeedbackResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
