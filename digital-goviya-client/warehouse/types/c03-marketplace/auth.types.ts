export type MarketplaceUserRole =
  | "farmer"
  | "miller";

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

export type VerificationSource =
  | "PMB"
  | "SELF_REGISTERED"
  | "RESEARCH_SYNTHETIC"
  | "NONE";

export interface MarketplaceUser {
  _id: string;

  username: string;

  fullName: string;

  email?: string;

  role:
    MarketplaceUserRole;

  phone: string;
  district: string;

  mustChangePassword: boolean;

  lastPasswordChangeAt?:
    | string
    | null;

  isActive: boolean;
  isVerified: boolean;

  verificationSource:
    VerificationSource;

  lastLoginAt?:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSession {
  token: string;

  user:
    MarketplaceUser;

  profile:
    MarketplaceRoleProfile;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role:
    MarketplaceUserRole;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data:
    MarketplaceSession;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data:
    MarketplaceSession;
}

export interface CurrentUserResponse {
  success: boolean;

  data: {
    user:
      MarketplaceUser;

    profile:
      MarketplaceRoleProfile;
  };
}