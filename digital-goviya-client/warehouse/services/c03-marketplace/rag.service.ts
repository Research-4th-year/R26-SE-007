import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  AskRagRequest,
  AskRagResponse,
} from "@/types/c03-marketplace/rag.types";

const RAG_TIMEOUT_MS = 300000;

export const ragService = {
  async askQuestion(
    payload: AskRagRequest
  ): Promise<AskRagResponse> {
    console.log(
      "POST /rag/ask:",
      payload
    );

    const response =
      await marketplaceApiClient.post<AskRagResponse>(
        "/rag/ask",
        payload,
        {
          timeout: RAG_TIMEOUT_MS,
        }
      );

    return response.data;
  },
};