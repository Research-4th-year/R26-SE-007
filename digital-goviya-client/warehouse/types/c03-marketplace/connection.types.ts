export type ConnectionPartnerType =
  | "farmer"
  | "miller";

export type ConnectionStatus =
  | "none"
  | "pending"
  | "accepted"
  | "rejected"
  | "removed";

export type ConnectionDirection =
  | "incoming"
  | "outgoing"
  | null;

export interface PublicFarmerProfile {
  id: string;
  type: "farmer";

  name: string;
  farmerName: string;

  district: string;
  location: string;

  farmName?: string;
  farmSizeAcres?: number;
  mainPaddyVariety?: string;

  isVerified: boolean;

  verificationSource:
    | "PMB"
    | "SELF_REGISTERED"
    | "RESEARCH_SYNTHETIC"
    | "NONE"
    | string;
}

export interface PublicMillerProfile {
  id: string;
  type: "miller";

  name: string;

  personName?: string;
  millName: string;

  district: string;
  location: string;

  businessRegistrationNumber?: string;
  purchasingCapacityKg?: number;

  isVerified: boolean;

  verificationSource:
    | "PMB"
    | "SELF_REGISTERED"
    | "RESEARCH_SYNTHETIC"
    | "NONE"
    | string;
}

export type PublicMarketplaceProfile =
  | PublicFarmerProfile
  | PublicMillerProfile;

export interface ConnectionState {
  connectionId:
    | string
    | null;

  status:
    ConnectionStatus;

  direction:
    ConnectionDirection;

  canSendRequest:
    boolean;

  canRespond:
    boolean;
}

export interface SearchMarketplaceItem {
  profile:
    PublicMarketplaceProfile;

  connection:
    ConnectionState;
}

export interface SearchMarketplaceResponse {
  success: boolean;
  count: number;

  searchingFor:
    ConnectionPartnerType;

  data:
    SearchMarketplaceItem[];
}

export interface PublicProfileContact {
  fullName: string;
  phone: string;
}

export interface PublicProfileResponse {
  success: boolean;

  data: {
    profile:
      PublicMarketplaceProfile;

    connection:
      ConnectionState;

    contactUnlocked:
      boolean;

    contact:
      PublicProfileContact | null;
  };
}

export interface SendConnectionResponse {
  success: boolean;
  message: string;

  data?: {
    connection?: {
      _id: string;
      farmerId: string;
      millerId: string;

      requestedBy:
        ConnectionPartnerType;

      status:
        ConnectionStatus;

      requestedAt:
        string;

      respondedAt?:
        string | null;

      createdAt:
        string;

      updatedAt:
        string;
    };

    connectionId?: string;

    direction?:
      ConnectionDirection;
  };
}

export interface MyConnectionItem {
  connectionId: string;

  status:
    Exclude<
      ConnectionStatus,
      "none"
    >;

  requestedBy:
    ConnectionPartnerType;

  direction:
    ConnectionDirection;

  requestedAt:
    string;

  respondedAt?:
    string | null;

  partner:
    PublicMarketplaceProfile;
}

export interface MyConnectionsResponse {
  success: boolean;
  count: number;
  data:
    MyConnectionItem[];
}

export interface RespondConnectionResponse {
  success: boolean;
  message: string;

  data: {
    connection: {
      _id: string;
      status:
        ConnectionStatus;
    };
  };
}