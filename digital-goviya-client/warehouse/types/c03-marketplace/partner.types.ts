export type PartnerType =
  | "farmer"
  | "miller";

export interface PartnerProfile {
  id: string;

  type:
    PartnerType;

  name: string;

  farmerName?: string;

  personName?: string;

  millName?: string;

  district: string;

  location: string;

  farmName?: string;

  farmSizeAcres?: number;

  mainPaddyVariety?: string;

  businessRegistrationNumber?: string;

  purchasingCapacityKg?: number;

  isVerified?: boolean;

  verificationSource?: string;
}

export interface PartnerRelationship {
  connected: boolean;

  connectionId:
    | string
    | null;

  connectionStatus?:
    | "none"
    | "pending"
    | "accepted"
    | "rejected"
    | "removed";

  hasTraded: boolean;
}

export interface PartnerSummary {
  totalAgreements: number;

  totalQuantityKg: number;

  averageAgreedPrice: number;

  latestAgreedPrice: number;

  lastTransactionAt:
    | string
    | null;

  paddyTypes:
    string[];

  totalTradeValue?: number;
}

export interface PartnerListItem {
  partner:
    PartnerProfile;

  summary:
    PartnerSummary;

  relationship:
    PartnerRelationship;

  isFavorite:
    boolean;

  contactUnlocked:
    boolean;
}

export interface PartnerTransaction {
  negotiationMongoId:
    string;

  negotiationId:
    string;

  paddyType:
    string;

  quantityKg:
    number;

  agreedPrice:
    number;

  totalValue:
    number;

  roundsCompleted:
    number;

  fairnessScore:
    number | null;

  flReferencePrice:
    number;

  priceDifferenceFromReference:
    number | null;

  status:
    string;

  finalReason:
    string;

  createdAt:
    string;
}

export interface PartnerContact {
  fullName:
    string;

  phone:
    string;
}

export interface PartnerHarvestOpportunity {
  _id: string;

  paddyType:
    string;

  season:
    string;

  quantity:
    number;

  expectedPrice:
    number;

  aiPredictedPrice:
    number;

  priceLevel:
    string;

  harvestScore:
    number;

  marketStatus:
    string;

  status:
    string;

  createdAt:
    string;
}

export interface PartnerDemandOpportunity {
  _id: string;

  paddyType:
    string;

  quantityNeeded:
    number;

  offeredPrice:
    number;

  status:
    string;

  createdAt:
    string;
}

export interface PartnerOpportunities {
  harvests:
    PartnerHarvestOpportunity[];

  demands:
    PartnerDemandOpportunity[];
}

export interface PartnerDetailData {
  partner:
    PartnerProfile;

  relationship:
    PartnerRelationship;

  summary:
    PartnerSummary;

  isFavorite:
    boolean;

  contactUnlocked:
    boolean;

  contactSource?:
    | "connection"
    | "negotiation_request"
    | null;

  contact:
    PartnerContact | null;

  opportunities:
    PartnerOpportunities;

  transactions:
    PartnerTransaction[];
}

export interface PartnerListResponse {
  success:
    boolean;

  count:
    number;

  data:
    PartnerListItem[];
}

export interface PartnerDetailResponse {
  success:
    boolean;

  data:
    PartnerDetailData;
}

export interface FavoritePartnerResponse {
  success:
    boolean;

  message:
    string;

  data: {
    isFavorite:
      boolean;

    favorite?:
      unknown;
  };
}