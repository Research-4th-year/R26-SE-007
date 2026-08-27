export type MarketplaceNotificationType =
  | "MATCH_REQUEST"
  | "MATCH_ACCEPTED"
  | "MATCH_REJECTED"
  | "NEGOTIATION_READY"
  | "NEGOTIATION_AGREED"
  | "NEGOTIATION_FAILED"
  | "CONTACT_REQUEST"
  | "CONTACT_ACCEPTED"
  | "CONTACT_REJECTED";

export interface NotificationText {
  english: string;
  sinhala: string;
}

export interface MarketplaceNotification {
  _id: string;

  recipientType:
    | "farmer"
    | "miller";

  recipientId: string;

  actorType:
    | "farmer"
    | "miller"
    | "system";

  actorId?: string | null;
  actorName: string;

  type:
    MarketplaceNotificationType;

  title:
    NotificationText;

  message:
    NotificationText;

  relatedHarvestId?:
    string | null;

  relatedSelectionId?:
    string | null;

  relatedNegotiationId?:
    string | null;

  relatedNegotiationCode?:
    string;

  relatedContactRequestId?:
    string | null;

  isRead: boolean;
  readAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  unreadCount: number;
  count: number;
  data:
    MarketplaceNotification[];
}

export interface NotificationMutationResponse {
  success: boolean;
  message: string;
  data?:
    MarketplaceNotification;
}