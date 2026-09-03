"use client";

import * as React from "react";
import { Badge, Button, Skeleton } from "./ui";
import { cn, initials } from "@/lib/utils";
import { fetchCurrentUser, resetDemoData, switchRole } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { GovernmentDashboard } from "./government-dashboard";
import { StartupPortal } from "./startup-portal";
import { ExpertEvaluation } from "./expert-evaluation";
import { AdminConsole } from "./admin-console";
import { StartupRegistrationDialog } from "./startup-registration";

const ROLES: { value: Role; label: string; caption: string }[] = [
  { value: "government", label: "Government Officer", caption: "Formulate challenges, track pilots, measure KPIs" },
  { value: "startup", label: "Startup", caption: "Discover challenges, submit proposals, track payments" },
  { value: "expert", label: "Expert Evaluator", caption: "Independent scoring panel" },
  { value: "admin", label: "Platform Admin", caption: "Milestones, legal templates, GeM scale-up" },
];

export function AppShell() {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>("government");
  const [switching, setSwitching] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      setRole(u.role);
    });
  }, []);

  async function changeRole(next: Role) {
    if (next === role) return;
    setSwitching(true);
    const u = await switchRole(next);
    setUser(u);
    setRole(next);
    setReloadKey((k) => k + 1);
    setSwitching(false);
  }

  async function resetData() {
    setSwitching(true);
    await resetDemoData();
    const u = await switchRole(role);
    setUser(u);
    setReloadKey((k) => k + 1);
    setSwitching(false);
  }

  const active = ROLES.find((r) => r.value === role);

  const [showRegistration, setShowRegistration] = React.useState(false);

  React.useEffect(() => {
    if (role === "startup" && user && !user.dpiit_number) {
      setShowRegistration(true);
    }
  }, [role, user]);

  function handleRegistered(u: User) {
    setUser(u);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white">
                GP
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight">GovPilot OS</h1>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    MSINS
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Maharashtra State Innovation Society · Outcome-based civic innovation pilots
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium leading-tight">{user.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {user.designation ?? active?.label}
                      {user.organization ? ` · ${user.organization}` : ""}
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {initials(user.full_name)}
                  </span>
                </div>
              ) : (
                <Skeleton className="h-9 w-40" />
              )}
              <Button variant="outline" size="sm" onClick={resetData} disabled={switching}>
                Reset demo data
              </Button>
            </div>
          </div>

          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Role">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => changeRole(r.value)}
                disabled={switching}
                title={r.caption}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                  role === r.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                )}
              >
                {r.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6" key={`${role}-${reloadKey}`}>
        {role === "government" && <GovernmentDashboard />}
        {role === "startup" && <StartupPortal />}
        {role === "expert" && <ExpertEvaluation />}
        {role === "admin" && <AdminConsole />}
      </main>

      <StartupRegistrationDialog
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegistered={handleRegistered}
      />

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400">
          GovPilot OS · SIH Problem Statement 26136 · Demo dataset covers PWD, Urban Waste and Water
          Quality challenges in the ₹5 Lakh – ₹5 Crore pilot band. All data is illustrative.
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
