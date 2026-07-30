import {
    LoginCredentials,
  MarketplaceSession,
  MarketplaceUser,
} from "@/types/c03-marketplace/auth.types";

const DEMO_PASSWORD = "demo123";

const DEMO_USERS: MarketplaceUser[] = [
  {
    id: "FARMER-001",
    fullName: "Sunil Perera",
    email: "farmer@digitalgoviya.lk",
    phone: "0712345678",
    role: "farmer",
    district: "Anuradhapura",
    farmerProfile: {
      farmName: "Green Field Paddy Farm",
      farmSizeAcres: 8.5,
      mainPaddyVariety: "Nadu",
    },
  },
  {
    id: "MILLER-001",
    fullName: "Nimal Silva",
    email: "miller@digitalgoviya.lk",
    phone: "0771234567",
    role: "miller",
    district: "Polonnaruwa",
    millerProfile: {
      millName: "Lakpura Rice Mill",
      businessRegistrationNumber: "BR-MILL-2026-001",
      purchasingCapacityKg: 25000,
    },
  },
];

function createDemoToken(user: MarketplaceUser): string {
  return `demo-token-${user.role}-${user.id}-${Date.now()}`;
}

export async function loginMarketplaceUser(
  credentials: LoginCredentials
): Promise<MarketplaceSession> {
  // This delay makes the demo feel like a real API request.
  await new Promise((resolve) => setTimeout(resolve, 800));

  const normalizedEmail = credentials.email.trim().toLowerCase();

  const user = DEMO_USERS.find(
    (demoUser) =>
      demoUser.email.toLowerCase() === normalizedEmail &&
      demoUser.role === credentials.role
  );

  if (!user || credentials.password !== DEMO_PASSWORD) {
    throw new Error(
      "Invalid email, password, or selected account category."
    );
  }

  return {
    token: createDemoToken(user),
    user,
    createdAt: new Date().toISOString(),
  };
}