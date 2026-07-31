import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  AskRagRequest,
  AskRagResponse,
} from "@/types/c03-marketplace/rag.types";

export const ragService = {
  async askQuestion(
    payload: AskRagRequest
  ): Promise<AskRagResponse> {
    const response =
      await marketplaceApiClient.post<AskRagResponse>(
        "/rag/ask",
        payload
      );

    return response.data;
  },
};