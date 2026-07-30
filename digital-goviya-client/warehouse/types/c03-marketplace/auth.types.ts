export type MarketplaceUserRole = "farmer" | "miller";

export interface MarketplaceUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: MarketplaceUserRole;
  district: string;

  farmerProfile?: {
    farmName: string;
    farmSizeAcres: number;
    mainPaddyVariety: string;
  };

  millerProfile?: {
    millName: string;
    businessRegistrationNumber: string;
    purchasingCapacityKg: number;
  };
}

export interface MarketplaceSession {
  token: string;
  user: MarketplaceUser;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: MarketplaceUserRole;
}