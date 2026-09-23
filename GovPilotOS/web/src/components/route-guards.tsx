"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "./ui";

/**
 * Redirects unauthenticated visitors to /login and signed-in users away from
 * the auth pages. Wrap page content with the variant matching the route group:
 *   <RequireAuth>   — inside (app) routes
 *   <RequireGuest>  — inside (auth) routes
 * While the session is being restored, render a spinner instead of flashing
 * the login page on every hard refresh.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loading label="Restoring session…" />
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loading label="Loading…" />
      </div>
    );
  }

  return <>{children}</>;
}
