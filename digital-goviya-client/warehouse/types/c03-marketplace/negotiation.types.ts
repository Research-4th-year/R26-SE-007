export type NegotiationStatus =
  | "agreed"
  | "rejected"
  | "max_rounds_reached"
  | "validation_failed"
  | "failed";

export type NegotiationAgent =
  | "farmer"
  | "miller";

export type NegotiationAction =
  | "accept"
  | "counter_offer"
  | "reject";

export interface NegotiationHistoryItem {
  round_number: number;
  agent: NegotiationAgent;
  action: NegotiationAction;
  price: number | null;
  reason: string;
}

export interface NegotiationRequestData {
  negotiation_id: string;
  paddy_type: string;
  quantity_kg: number;
  district: string;

  farmer_expected_price: number;
  farmer_minimum_price?: number;

  miller_opening_price: number;
  miller_maximum_price?: number;

  fl_reference_price: number;
  matching_score: number;
  max_rounds: number;
}

export interface Negotiation {
  _id: string;

  negotiationId: string;

  listingId?: string | null;
  farmerId?: string | null;
  millerId?: string | null;

  requestData: NegotiationRequestData;

  status: NegotiationStatus;

  agreedPrice: number | null;
  roundsCompleted: number;

  finalReason: string;

  flReferencePrice: number;
  fairnessScore: number | null;

  priceDifferenceFromReference:
    | number
    | null;

  history: NegotiationHistoryItem[];

  createdAt: string;
  updatedAt: string;
}

export interface StartNegotiationRequest {
  selectionId: string;
}

export interface NegotiationResponse {
  success: boolean;
  message?: string;
  data: Negotiation;
}

export interface NegotiationListResponse {
  success: boolean;
  count: number;
  data: Negotiation[];
}

export interface NegotiationHealthResponse {
  success: boolean;

  data: {
    status: string;
    service: string;
  };
}