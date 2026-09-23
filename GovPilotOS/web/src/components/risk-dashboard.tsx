"use client";

import * as React from "react";
import { Card, SectionLabel, Loading } from "./ui";
import { fetchRisks } from "@/lib/api";

function SeverityPill({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    high: "bg-red-600 text-white",
    medium: "bg-amber-500 text-slate-900",
    low: "bg-emerald-500 text-white",
  };
  const cls = map[severity] || "bg-slate-400 text-white";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{severity}</span>;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full rounded-md bg-slate-100 h-3">
      <div className="h-3 rounded-md" style={{ width: `${pct}%`, background: `linear-gradient(90deg,#10b981,#06b6d4)` }} />
    </div>
  );
}

export function RiskDashboard() {
  const [risks, setRisks] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchRisks()
      .then((r) => {
        if (!mounted) return;
        setRisks(r || []);
      })
      .catch(() => {
        if (!mounted) return;
        setRisks([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Card><Loading label="Loading risks…" /></Card>;

  const counts: Record<string, number> = { high: 0, medium: 0, low: 0, total: 0 };
  const statusCounts: Record<string, number> = {};
  (risks || []).forEach((r: any) => {
    const sev = (r.severity || 'medium').toLowerCase();
    counts[sev] = (counts[sev] || 0) + 1;
    counts.total++;
    statusCounts[r.status || 'open'] = (statusCounts[r.status || 'open'] || 0) + 1;
  });

  const severitySeries = [
    { label: 'High', value: counts.high, color: 'red-600' },
    { label: 'Medium', value: counts.medium, color: 'amber-500' },
    { label: 'Low', value: counts.low, color: 'emerald-500' },
  ];

  return (
    <Card>
      <SectionLabel>Risk register</SectionLabel>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-sm text-slate-500">Severity distribution</div>
          {severitySeries.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full bg-${s.color}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700">{s.label}</div>
                  <div className="text-sm font-semibold text-slate-900">{s.value}</div>
                </div>
                <ProgressBar value={counts.total ? (s.value / counts.total) * 100 : 0} />
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">Recent risks</div>
              <div className="text-xs text-slate-500">Showing latest 8</div>
            </div>
            <div className="text-sm text-slate-500">Total: {counts.total}</div>
          </div>

          <div className="mt-3 space-y-2">
            {(risks || []).slice(0, 8).map((r: any) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-slate-900">{r.title}</h4>
                    <SeverityPill severity={(r.severity || 'medium').toLowerCase()} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{r.description}</p>
                  <p className="mt-2 text-xs text-slate-400">Owner: {r.owner || 'N/A'} · Created: {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="w-32">
                  <div className="text-xs text-slate-500">Mitigation progress</div>
                  <ProgressBar
                    value={
                      r.status === "resolved"
                        ? 100
                        : r.status === "mitigating"
                          ? 60
                          : 15
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default RiskDashboard;
