import { useContext } from "react";

import {
  MarketplaceAuthContext,
} from "@/contexts/c03-marketplace/MarketplaceAuthContext";

export function useMarketplaceAuth() {
  const context =
    useContext(MarketplaceAuthContext);

  if (!context) {
    throw new Error(
      "useMarketplaceAuth must be used inside MarketplaceAuthProvider."
    );
  }

  return context;
}