import { api } from "@/services/shared/api";

export interface RankedCandidate {
  warehouseId: string;
  name: string;
  code: string;
  district: string;
  distanceKm: number;
  currentStockTons: number;
  availableTons: number;
  capacityTons: number;
  reliabilityScore: number;
  compositeScore: number;
  canFulfil: boolean;
  zkpVerified: boolean;
}

export interface Disaster {
  id: string;
  disasterType: string;
  description: string | null;
  estimatedLossTons: number | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  occurredAt: string;
  blockchainTxId: string | null;
  affectedWarehouse: { id: string; name: string; code: string; district: string };
  reportedBy: { id: string; fullName: string; role: string };
  redistributionOrders?: any[];
  zkpProofs?: any[];
  rankedCandidates?: RankedCandidate[];
}

export const disasterService = {
  async listDisasters(status?: string): Promise<Disaster[]> {
    const url = status ? `/api/disasters?status=${status}` : "/api/disasters";
    const res = await api.get(url);
    return res.data.data.items;
  },

  async getDisaster(id: string): Promise<Disaster> {
    const res = await api.get(`/api/disasters/${id}`);
    return res.data.data;
  },

  async createDisaster(data: {
    disasterType: string;
    affectedWarehouseId: string;
    description?: string;
    estimatedLossTons?: number;
    occurredAt: string;
  }): Promise<Disaster> {
    const res = await api.post("/api/disasters", data);
    return res.data.data;
  },

  async redistribute(disasterId: string, sourceWarehouseId: string, quantityTons: number) {
    const res = await api.post(`/api/disasters/${disasterId}/redistribute`, {
      sourceWarehouseId,
      quantityTons,
    });
    return res.data.data;
  },

  async updateStatus(disasterId: string, status: string) {
    const res = await api.patch(`/api/disasters/${disasterId}/status`, { status });
    return res.data.data;
  },

  async getAuditTrail(disasterId: string) {
    const res = await api.get(`/api/disasters/${disasterId}/audit`);
    return res.data.data;
  },
};
