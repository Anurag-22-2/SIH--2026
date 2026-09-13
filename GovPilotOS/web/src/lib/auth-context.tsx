"use client";

import * as React from "react";
import {
  authSignIn,
  authSignUp,
  authSignOut,
  hasAuthToken,
  fetchCurrentUser,
  type SignUpInput,
} from "@/lib/api";
import type { Role, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: Role) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  signOut: () => void;
  /** Directly update the cached user (e.g. after DPIIT registration). */
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Restore the session from the stored token on first mount. A missing token
  // means unauthenticated; `fetchCurrentUser` handles both live tokens and the
  // offline "demo" token minted by the auth fallbacks.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      try {
        const current = await fetchCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = React.useCallback(
    async (email: string, password: string, role: Role = "government") => {
      const { user: next } = await authSignIn(email, password, role);
      setUser(next);
      return next;
    },
    [],
  );

  const signUp = React.useCallback(async (input: SignUpInput) => {
    const { user: next } = await authSignUp(input);
    setUser(next);
    return next;
  }, []);

  const signOut = React.useCallback(() => {
    authSignOut();
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut, setUser }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
