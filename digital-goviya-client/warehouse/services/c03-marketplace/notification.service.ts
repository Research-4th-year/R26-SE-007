import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  NotificationListResponse,
  NotificationMutationResponse,
} from "@/types/c03-marketplace/notification.types";

export const notificationService = {
  async getMine():
    Promise<NotificationListResponse> {
    const response =
      await marketplaceApiClient.get<NotificationListResponse>(
        "/api/marketplace/api/notifications/mine"
      );

    return response.data;
  },

  async markAsRead(
    notificationId: string
  ): Promise<NotificationMutationResponse> {
    const response =
      await marketplaceApiClient.patch<NotificationMutationResponse>(
        `/api/marketplace/api/notifications/${notificationId}/read`
      );

    return response.data;
  },

  async markAllAsRead():
    Promise<NotificationMutationResponse> {
    const response =
      await marketplaceApiClient.patch<NotificationMutationResponse>(
        "/api/marketplace/api/notifications/read-all"
      );

    return response.data;
  },
};