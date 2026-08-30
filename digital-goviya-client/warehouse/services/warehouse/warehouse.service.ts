import { api } from "@/services/shared/api";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  district: string;
  capacityTons: number;
  currentStockTons: number;
  availableTons: number;
  utilizationPct: number;
  reliabilityScore: number | null;
  anomalyFlags: string[] | null;
  isActive: boolean;
  latitude: number;
  longitude: number;
}

export interface NetworkSummary {
  totalWarehouses: number;
  totalCapacityTons: number;
  totalStockTons: number;
  totalAvailableTons: number;
  networkUtilPct: number;
  openDisasters: number;
}

export const warehouseService = {
  async getSummary(): Promise<NetworkSummary> {
    const res = await api.get("/api/warehouses/summary");
    return res.data.data;
  },

  async listWarehouses(): Promise<Warehouse[]> {
    const res = await api.get("/api/warehouses?limit=50&isActive=true");
    return res.data.data.items;
  },

  async getWarehouse(id: string): Promise<Warehouse> {
    const res = await api.get(`/api/warehouses/${id}`);
    return res.data.data;
  },
};
