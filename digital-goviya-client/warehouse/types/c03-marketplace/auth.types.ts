export type MarketplaceUserRole = "farmer" | "miller";

export interface FarmerProfile {
  _id: string;
  user: string;
  farmerName: string;
  district: string;
  location: string;
  farmName: string;
  farmSizeAcres: number;
  mainPaddyVariety: string;
  createdAt: string;
  updatedAt: string;
}

export interface MillerProfile {
  _id: string;
  user: string;
  name: string;
  millName: string;
  district: string;
  location: string;
  businessRegistrationNumber: string;
  purchasingCapacityKg: number;
  createdAt: string;
  updatedAt: string;
}

export type MarketplaceRoleProfile =
  | FarmerProfile
  | MillerProfile;

export interface MarketplaceUser {
  _id: string;
  fullName: string;
  email: string;
  role: MarketplaceUserRole;
  phone: string;
  district: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSession {
  token: string;
  user: MarketplaceUser;
  profile: MarketplaceRoleProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: MarketplaceUserRole;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: MarketplaceSession;
}

export interface CurrentUserResponse {
  success: boolean;
  data: {
    user: MarketplaceUser;
    profile: MarketplaceRoleProfile;
  };
}