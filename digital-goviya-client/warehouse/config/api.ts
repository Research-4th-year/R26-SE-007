
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
}

export const API_URLS = {
  forecast: `${API_BASE}/api/forecast`,
  farming: `${API_BASE}/api/farming`,
  marketplaceAI: `${API_BASE}/api/marketplace/ai`,
  marketplace: `${API_BASE}/api/marketplace`,
  blockchain: `${API_BASE}/api/blockchain`,
};

export default API_BASE;
