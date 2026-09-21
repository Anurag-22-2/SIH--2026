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

const FEATURES: Record<Role, { label: string; hint: string }[]> = {
  government: [
    { label: "Overview", hint: "Dashboard and KPIs" },
    { label: "Challenges", hint: "Formulate civic challenges" },
    { label: "Proposals", hint: "Review startup submissions" },
    { label: "Pilots", hint: "Track active pilots" },
    { label: "Procurement", hint: "Scale successful pilots" },
  ],
  startup: [
    { label: "Overview", hint: "Startup workspace" },
    { label: "Challenges", hint: "Discover opportunities" },
    { label: "Proposals", hint: "Manage submissions" },
    { label: "Pilots", hint: "Track delivery" },
    { label: "Payments", hint: "Milestones and payments" },
  ],
  expert: [
    { label: "Evaluation queue", hint: "Assigned proposals" },
    { label: "Scoring", hint: "Independent evaluation" },
    { label: "Recommendations", hint: "Submit recommendations" },
  ],
  admin: [
    { label: "Overview", hint: "Platform health" },
    { label: "Users", hint: "Manage platform users" },
    { label: "Templates", hint: "Legal and procurement templates" },
    { label: "Audit activity", hint: "Review platform activity" },
  ],
};

export function AppShell() {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>("government");
  const [switching, setSwitching] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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

  const features = FEATURES[role];
  const closeSidebar = () => setSidebarOpen(false);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-950">
            GP
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">GovPilot OS</p>
              <Badge className="bg-slate-800 text-slate-200">MSINS</Badge>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Innovation pilot platform
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-800 px-4 py-4">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Workspace role
        </p>
        <div className="mt-2 grid gap-1">
          {ROLES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                void changeRole(item.value);
                closeSidebar();
              }}
              disabled={switching}
              title={item.caption}
              className={cn(
                "rounded-md px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-60",
                role === item.value
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Workspace features">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Features
        </p>
        <div className="mt-2 grid gap-1">
          {features.map((feature, index) => (
            <a
              key={feature.label}
              href="#workspace"
              onClick={closeSidebar}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                index === 0
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-700 text-[10px] font-semibold text-slate-400 group-hover:border-slate-500 group-hover:text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{feature.label}</span>
                <span className="block truncate text-[11px] text-slate-500 group-hover:text-slate-400">
                  {feature.hint}
                </span>
              </span>
            </a>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-md bg-slate-900 p-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold">
              {initials(user.full_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.full_name}</p>
              <p className="truncate text-xs text-slate-400">
                {user.organization || active?.label}
              </p>
            </div>
          </div>
        ) : (
          <Skeleton className="h-14 w-full bg-slate-800" />
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/60"
            onClick={closeSidebar}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <span className="sr-only">Open navigation</span>
              <span className="grid gap-1">
                <span className="block h-0.5 w-4 bg-current" />
                <span className="block h-0.5 w-4 bg-current" />
                <span className="block h-0.5 w-4 bg-current" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight">GovPilot OS workspace</p>
              <p className="truncate text-xs text-slate-500">
                {active?.caption}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetData} disabled={switching}>
              Reset demo data
            </Button>
          </div>
        </header>

        <main id="workspace" className="mx-auto max-w-7xl px-4 py-6 sm:px-6" key={`${role}-${reloadKey}`}>
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
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6">
            GovPilot OS · SIH Problem Statement 26136 · Demo dataset covers PWD, Urban Waste and Water
            Quality challenges in the ₹5 Lakh – ₹5 Crore pilot band. All data is illustrative.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppShell;
