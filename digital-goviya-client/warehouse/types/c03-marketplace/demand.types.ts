import type {
  PaddyType,
} from "@/types/c03-marketplace/harvest.types";

export type DemandStatus =
  | "open"
  | "negotiation_ready"
  | "negotiating"
  | "agreement_reached"
  | "negotiation_failed"
  | "rejected"
  | "cancelled";

export interface CreateDemandRequest {
  paddyType: PaddyType;
  quantityNeeded: number;
  offeredPrice: number;
}

export interface MillerDemand {
  _id: string;
  millerId: string;

  paddyType: string;
  quantityNeeded: number;
  offeredPrice: number;
  status: DemandStatus;

  createdAt: string;
  updatedAt: string;
}

export interface CreateDemandResponse {
  success: boolean;
  message?: string;
  data: MillerDemand;
}

export interface GetDemandsResponse {
  success: boolean;
  count: number;
  data: MillerDemand[];
}