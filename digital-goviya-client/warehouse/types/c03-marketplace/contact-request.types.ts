export type ContactRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type ContactRequestRole =
  | "farmer"
  | "miller";

export interface ContactRequest {
  _id: string;

  negotiationId: string;
  farmerId: string;
  millerId: string;

  requestedBy: ContactRequestRole;

  status: ContactRequestStatus;

  requestedAt: string;
  respondedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ContactParticipant {
  name: string;
  phone: string;
  district: string;
  location: string;

  farmerName?: string;
  millName?: string;
}

export interface ContactInformation {
  farmer: ContactParticipant;
  miller: ContactParticipant;
}

export interface ContactRequestState {
  exists: boolean;

  request: ContactRequest | null;

  contactUnlocked: boolean;

  canRequest: boolean;

  canRespond: boolean;

  contact: ContactInformation | null;
}

export interface ContactRequestStateResponse {
  success: boolean;
  data: ContactRequestState;
}

export interface CreateContactRequestPayload {
  negotiationId: string;
}

export interface ContactRequestMutationResponse {
  success: boolean;
  message: string;

  data: {
    request: ContactRequest;
    contactUnlocked: boolean;
    contact?: ContactInformation | null;
  };
}