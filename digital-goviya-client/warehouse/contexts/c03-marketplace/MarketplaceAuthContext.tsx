import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loginMarketplaceUser } from "@/services/c03-marketplace/auth.service";

import {
  getMarketplaceSession,
  removeMarketplaceSession,
  saveMarketplaceSession,
} from "@/services/marketplace-session-storage";

import {
  LoginCredentials,
  MarketplaceSession,
  MarketplaceUser,
} from "@/types/c03-marketplace/auth.types";

interface MarketplaceAuthContextValue {
  session: MarketplaceSession | null;
  user: MarketplaceUser | null;

  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (
    credentials: LoginCredentials
  ) => Promise<void>;

  signOut: () => Promise<void>;
}

const MarketplaceAuthContext =
  createContext<
    MarketplaceAuthContextValue | undefined
  >(undefined);

interface MarketplaceAuthProviderProps {
  children: ReactNode;
}

export function MarketplaceAuthProvider({
  children,
}: MarketplaceAuthProviderProps) {
  const [session, setSession] =
    useState<MarketplaceSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const restoreSession = useCallback(
    async (): Promise<void> => {
      try {
        const storedSession =
          await getMarketplaceSession();

        if (!storedSession) {
          setSession(null);
          return;
        }

        const parsedSession =
          JSON.parse(
            storedSession
          ) as MarketplaceSession;

        const isSessionValid =
          Boolean(parsedSession.token) &&
          Boolean(parsedSession.user) &&
          Boolean(parsedSession.user.role);

        if (!isSessionValid) {
          await removeMarketplaceSession();
          setSession(null);
          return;
        }

        setSession(parsedSession);
      } catch (error) {
        console.error(
          "Failed to restore marketplace session:",
          error
        );

        await removeMarketplaceSession();
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<void> => {
      const newSession =
        await loginMarketplaceUser(credentials);

      await saveMarketplaceSession(
        JSON.stringify(newSession)
      );

      setSession(newSession);
    },
    []
  );

  const signOut =
    useCallback(async (): Promise<void> => {
      await removeMarketplaceSession();
      setSession(null);
    }, []);

  const value =
    useMemo<MarketplaceAuthContextValue>(
      () => ({
        session,

        user: session?.user ?? null,

        isLoading,

        isAuthenticated: Boolean(
          session?.token && session?.user
        ),

        signIn,
        signOut,
      }),
      [
        session,
        isLoading,
        signIn,
        signOut,
      ]
    );

  return (
    <MarketplaceAuthContext.Provider
      value={value}
    >
      {children}
    </MarketplaceAuthContext.Provider>
  );
}

export function useMarketplaceAuth(): MarketplaceAuthContextValue {
  const context =
    useContext(MarketplaceAuthContext);

  if (!context) {
    throw new Error(
      "useMarketplaceAuth must be used inside MarketplaceAuthProvider."
    );
  }

  return context;
}