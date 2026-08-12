export type PartnerType = "farmer" | "miller";

export interface PartnerProfile {
  id: string;
  type: PartnerType;
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
}

export interface PartnerSummary {
  totalAgreements: number;
  totalQuantityKg: number;
  averageAgreedPrice: number;
  latestAgreedPrice: number;
  lastTransactionAt: string;
  paddyTypes: string[];
  totalTradeValue?: number;
}

export interface PartnerListItem {
  partner: PartnerProfile;
  summary: PartnerSummary;
  isFavorite: boolean;
  contactUnlocked: boolean;
}

export interface PartnerTransaction {
  negotiationMongoId: string;
  negotiationId: string;
  paddyType: string;
  quantityKg: number;
  agreedPrice: number;
  totalValue: number;
  roundsCompleted: number;
  fairnessScore: number | null;
  flReferencePrice: number;
  priceDifferenceFromReference: number | null;
  status: string;
  finalReason: string;
  createdAt: string;
}

export interface PartnerContact {
  fullName: string;
  phone: string;
}

export interface PartnerDetailData {
  partner: PartnerProfile;
  summary: PartnerSummary;
  isFavorite: boolean;
  contactUnlocked: boolean;
  contact: PartnerContact | null;
  transactions: PartnerTransaction[];
}

export interface PartnerListResponse {
  success: boolean;
  count: number;
  data: PartnerListItem[];
}

export interface PartnerDetailResponse {
  success: boolean;
  data: PartnerDetailData;
}

export interface FavoritePartnerResponse {
  success: boolean;
  message: string;
  data: {
    isFavorite: boolean;
    favorite?: unknown;
  };
}