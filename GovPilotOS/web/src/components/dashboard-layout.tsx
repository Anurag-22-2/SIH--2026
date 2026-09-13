"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Button } from "./ui";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/challenges", label: "Challenges" },
  { href: "/proposals", label: "Proposals" },
  { href: "/pilots", label: "Active Pilots" },
  { href: "/settings", label: "Settings" },
] as const;

const ROLE_LABEL: Record<User["role"], string> = {
  government: "Government Officer",
  startup: "Startup",
  expert: "Expert Evaluator",
  admin: "Platform Admin",
};

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}

/**
 * Application shell for authenticated pages: fixed dark sidebar with primary
 * navigation and a user/logout block pinned to the bottom, next to a main
 * content area on a soft #f8fafc canvas that lets white data cards stand out.
 * `children` carries the routed page; `title`/`description`/`actions` let each
 * page fill the standard top bar.
 */
export function DashboardLayout({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const activeHref =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? "/dashboard";

  const nav = (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          active={activeHref === item.href}
        />
      ))}
    </nav>
  );

  const userBlock = user ? (
    <div className="border-t border-slate-800 p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
          {initials(user.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {user.full_name}
          </p>
          <p className="truncate text-xs text-slate-400">
            {ROLE_LABEL[user.role]}
            {user.organization ? ` · ${user.organization}` : ""}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
        onClick={signOut}
      >
        Sign out
      </Button>
    </div>
  ) : (
    <div className="border-t border-slate-800 p-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
          ?
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Signed out</p>
          <p className="text-xs text-slate-400">Session expired</p>
        </div>
      </div>
      <Link
        href="/login"
        className="mt-1 block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        Sign in
      </Link>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-900">
        GP
      </span>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-white">
            GovPilot OS
          </span>
          <Badge className="hidden bg-slate-800 text-slate-200 sm:inline-flex">
            MSINS
          </Badge>
        </div>
        <span className="text-[11px] text-slate-400">
          Maharashtra State Innovation Society
        </span>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Desktop sidebar: fixed so the main area scrolls independently. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        {brand}
        {nav}
        {userBlock}
      </aside>

      {/* Mobile drawer. */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="flex h-full w-64 flex-col bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            aria-label="Navigation menu"
          >
            {brand}
            {nav}
            {userBlock}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate text-base font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="truncate text-xs text-slate-500">{description}</p>
              )}
            </div>
            {actions}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6">
            GovPilot OS · SIH Problem Statement 26136 · Demo dataset covers PWD,
            Urban Waste and Water Quality challenges. All data is illustrative.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
