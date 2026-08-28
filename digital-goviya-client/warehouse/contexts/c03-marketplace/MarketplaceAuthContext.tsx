import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentMarketplaceUser,
  loginMarketplaceUser,
} from "@/services/c03-marketplace/auth.service";

import {
  getMarketplaceSession,
  removeMarketplaceSession,
  saveMarketplaceSession,
} from "@/services/c03-marketplace/session-storage.service";

import type {
  LoginCredentials,
  MarketplaceRoleProfile,
  MarketplaceSession,
  MarketplaceUser,
} from "@/types/c03-marketplace/auth.types";

interface MarketplaceAuthContextValue {
  session: MarketplaceSession | null;
  user: MarketplaceUser | null;
  profile: MarketplaceRoleProfile | null;

  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (
    credentials: LoginCredentials
  ) => Promise<MarketplaceSession>;

  refreshCurrentUser: () => Promise<void>;

  signOut: () => Promise<void>;
}

export const MarketplaceAuthContext =
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

  const clearSession =
    useCallback(async (): Promise<void> => {
      await removeMarketplaceSession();
      setSession(null);
    }, []);

  const restoreSession =
    useCallback(async (): Promise<void> => {
      try {
        const storedSession =
          await getMarketplaceSession();

        if (!storedSession) {
          setSession(null);
          return;
        }

        const parsedSession = JSON.parse(
          storedSession
        ) as MarketplaceSession;

        if (
          !parsedSession.token ||
          !parsedSession.user ||
          !parsedSession.profile
        ) {
          await clearSession();
          return;
        }

        /*
         * Temporarily place the stored session in state so
         * the API interceptor can access its saved token.
         */
        setSession(parsedSession);

        /*
         * Validate the token with the backend and retrieve
         * the latest user/profile information.
         */
        const currentUser =
          await getCurrentMarketplaceUser();

        const refreshedSession: MarketplaceSession = {
          token: parsedSession.token,
          user: currentUser.user,
          profile: currentUser.profile,
        };

        await saveMarketplaceSession(
          JSON.stringify(refreshedSession)
        );

        setSession(refreshedSession);
      } catch (error) {
        console.error(
          "Failed to restore marketplace session:",
          error
        );

        await clearSession();
      } finally {
        setIsLoading(false);
      }
    }, [clearSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<MarketplaceSession> => {
      const newSession =
        await loginMarketplaceUser(credentials);

      await saveMarketplaceSession(
        JSON.stringify(newSession)
      );

      setSession(newSession);

      return newSession;
    },
    []
  );

  const refreshCurrentUser =
    useCallback(async (): Promise<void> => {
      if (!session?.token) {
        return;
      }

      const currentUser =
        await getCurrentMarketplaceUser();

      const refreshedSession: MarketplaceSession = {
        token: session.token,
        user: currentUser.user,
        profile: currentUser.profile,
      };

      await saveMarketplaceSession(
        JSON.stringify(refreshedSession)
      );

      setSession(refreshedSession);
    }, [session?.token]);

  const signOut =
    useCallback(async (): Promise<void> => {
      await clearSession();
    }, [clearSession]);

  const value =
    useMemo<MarketplaceAuthContextValue>(
      () => ({
        session,

        user: session?.user ?? null,

        profile: session?.profile ?? null,

        isLoading,

        isAuthenticated: Boolean(
          session?.token && session?.user
        ),

        signIn,

        refreshCurrentUser,

        signOut,
      }),
      [
        session,
        isLoading,
        signIn,
        refreshCurrentUser,
        signOut,
      ]
    );

  return (
    <MarketplaceAuthContext.Provider value={value}>
      {children}
    </MarketplaceAuthContext.Provider>
  );
}