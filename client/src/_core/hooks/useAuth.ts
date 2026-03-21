import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // Still uses trpc.auth.me to get the FULL legacy user object
  // (with subscriptionStatus, conduitId, voicePreference, etc.)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const logout = useCallback(async () => {
    try {
      // Sign out via Better Auth (clears session cookie)
      await authClient.signOut();
    } catch {
      // Ignore errors during sign-out
    } finally {
      // Clear the tRPC cache
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    meQuery.isLoading,
    state.user,
  ]);

  // Refetch auth state when page becomes visible (e.g., after OAuth redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        meQuery.refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [meQuery]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
