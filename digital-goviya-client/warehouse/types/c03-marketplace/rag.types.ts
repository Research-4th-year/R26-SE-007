export interface AskRagRequest {
  question: string;
}

export interface RagResponseData {
  query: string;
  results: unknown[];
  context: string;
  answer: string | null;
}

export interface AskRagResponse {
  success: boolean;
  data: RagResponseData;
}

export interface RagChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  context?: string;
  results?: unknown[];
  createdAt: number;
  failed?: boolean;
}