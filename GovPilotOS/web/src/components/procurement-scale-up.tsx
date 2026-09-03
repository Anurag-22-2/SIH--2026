"use client";

import * as React from "react";
import {
  Button,
  Card,
  Dialog,
  Field,
  Loading,
  SectionLabel,
  StatCard,
  Tag,
  Textarea,
} from "./ui";
import { StatusBadge } from "./shared";
import {
  actOnApproval,
  advanceGemStage,
  createScaleDecision,
  fetchDashboard,
  fetchReadiness,
} from "@/lib/api";
import { buildPilotViews } from "@/lib/derive";
import { formatInrCompact, humanise } from "@/lib/utils";
import type {
  DashboardData,
  GemStage,
  Pilot,
  ReadinessScorecard,
  ScaleDecision,
  ScaleDecisionType,
} from "@/lib/types";

const GEM_CATEGORIES = [
  { name: "IoT Water Quality Sensors", code: "GeM/WQM/4471" },
  { name: "Road Asset Monitoring (PWD)", code: "GeM/PWD/1182" },
  { name: "Waste Segregation & Processing", code: "GeM/UWM/3094" },
  { name: "Citizen Grievance Analytics", code: "GeM/CGA/5520" },
];

const DECISION_LABEL: Record<ScaleDecisionType, string> = {
  gem_procurement: "GeM procurement",
  scale_pilot: "Extended pilot",
  iterate: "Iterate",
  exit: "Exit",
};

const GEM_STAGES: GemStage[] = [
  "not_started",
  "category_mapped",
  "listed",
  "bid_published",
  "contract_awarded",
];

export function ProcurementScaleUp() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [tab, setTab] = React.useState<"pipeline" | "decisions">("decisions");
  const [busy, setBusy] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [readinessFor, setReadinessFor] = React.useState<string | null>(null);
  const [readiness, setReadiness] = React.useState<ReadinessScorecard | null>(null);

  const refresh = React.useCallback(async () => {
    setData(await fetchDashboard());
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function openReadiness(pilotId: string) {
    setReadinessFor(pilotId);
    setReadiness(await fetchReadiness(pilotId));
  }

  if (!data) return <Loading label="Loading procurement pipeline…" />;

  const views = buildPilotViews(data);
  const completed = views.filter((v) => v.pilot.status === "completed");
  const gemLive = data.scaleDecisions.filter((d) => d.gem.stage !== "not_started");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Procurement & Scale-Up (GeM)</h2>
        <p className="text-sm text-slate-500">
          Translate validated pilot outcomes into a government procurement pathway via GeM, with
          outcome-based approvals and the Startup Runway exemption.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Completed pilots" value={completed.length} hint="Eligible for scale-up" />
        <StatCard label="Scale decisions" value={data.scaleDecisions.length} hint="Recorded" />
        <StatCard label="GeM live" value={gemLive.length} hint="In procurement" />
        <StatCard
          label="Procurement value"
          value={formatInrCompact(
            data.scaleDecisions.reduce((s, d) => s + (d.gem.contract_value ?? d.budget_allocated), 0),
          )}
          hint="Across decisions"
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabBtn active={tab === "decisions"} onClick={() => setTab("decisions")}>
          Scale-up decisions
        </TabBtn>
        <TabBtn active={tab === "pipeline"} onClick={() => setTab("pipeline")}>
          Readiness pipeline
        </TabBtn>
      </div>

      {tab === "decisions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)} disabled={completed.length === 0}>
              + New scale-up decision
            </Button>
          </div>
          {data.scaleDecisions.length === 0 ? (
            <p className="text-sm text-slate-500">No scale-up decisions recorded yet.</p>
          ) : (
            data.scaleDecisions.map((d) => (
              <ScaleDecisionCard key={d.id} decision={d} onChanged={refresh} />
            ))
          )}
        </div>
      )}

      {tab === "pipeline" && (
        <div className="grid gap-4 md:grid-cols-2">
          {views.map((v) => (
            <Card key={v.pilot.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{v.pilot.title}</p>
                  <p className="text-xs text-slate-500">
                    {v.pilot.startup_name} · {formatInrCompact(v.pilot.budget_allocated)}
                  </p>
                </div>
                <StatusBadge status={v.pilot.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>KPI achievement</span>
                <span className="font-medium">{v.kpiAchievementAvg ?? "—"}%</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => openReadiness(v.pilot.id)}
              >
                View readiness scorecard
              </Button>
            </Card>
          ))}
        </div>
      )}

      {readinessFor && readiness && (
        <ReadinessDialog
          pilot={views.find((v) => v.pilot.id === readinessFor)?.pilot}
          scorecard={readiness}
          onClose={() => {
            setReadinessFor(null);
            setReadiness(null);
          }}
        />
      )}

      {createOpen && (
        <CreateScaleDecisionDialog
          completedPilots={completed.map((v) => v.pilot)}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refresh();
          }}
        />
      )}

      {busy && <Loading label="Working…" />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ScaleDecisionCard({
  decision,
  onChanged,
}: {
  decision: ScaleDecision;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const nextStage = GEM_STAGES[GEM_STAGES.indexOf(decision.gem.stage) + 1];

  async function advance() {
    if (!nextStage) return;
    setBusy(true);
    await advanceGemStage(decision.id, { stage: nextStage });
    setBusy(false);
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{decision.pilot_title ?? decision.pilot_id}</p>
          <p className="text-xs text-slate-500">
            {DECISION_LABEL[decision.decision]} · {formatInrCompact(decision.budget_allocated)}
          </p>
        </div>
        <Tag tone={decision.decision === "gem_procurement" ? "success" : "default"}>
          {humanise(decision.decision)}
        </Tag>
      </div>

      <div className="mt-3 rounded-md bg-slate-50 p-3">
        <SectionLabel>GeM procurement</SectionLabel>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {decision.gem.category} ({decision.gem.category_code})
          </span>
          <StatusBadge status={decision.gem.stage} />
        </div>
        {decision.gem.mode && (
          <p className="mt-1 text-xs text-slate-500">Mode: {humanise(decision.gem.mode)}</p>
        )}
        {decision.gem.startup_runway_exemption && (
          <Tag tone="info" className="mt-2">
            Startup Runway exemption applied
          </Tag>
        )}
        {nextStage && (
          <Button size="sm" className="mt-2" onClick={advance} disabled={busy}>
            Advance to {humanise(nextStage)}
          </Button>
        )}
      </div>

      <div className="mt-3">
        <SectionLabel>Approval chain</SectionLabel>
        <ol className="mt-2 space-y-2">
          {decision.approvals.map((a) => (
            <li key={a.stage} className="rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{a.stage}</p>
                  <p className="text-xs text-slate-500">{a.authority}</p>
                  {a.remark && <p className="mt-1 text-xs text-slate-400">{a.remark}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={async () => {
                          setBusy(true);
                          await actOnApproval(decision.id, a.stage, "approved", "Approved on review.");
                          setBusy(false);
                          onChanged();
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          setBusy(true);
                          await actOnApproval(decision.id, a.stage, "rejected", "Not approved.");
                          setBusy(false);
                          onChanged();
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

function ReadinessDialog({
  pilot,
  scorecard,
  onClose,
}: {
  pilot?: Pilot;
  scorecard: ReadinessScorecard;
  onClose: () => void;
}) {
  return (
    <Dialog open title={`Readiness scorecard · ${pilot?.title ?? ""}`} onClose={onClose} width="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="KPI achievement" value={`${scorecard.kpi_achievement}%`} />
          <Metric label="Milestone completion" value={`${scorecard.milestone_completion}%`} />
          <Metric label="Evaluation score" value={`${scorecard.evaluation_score}%`} />
          <Metric label="Budget adherence" value={`${scorecard.budget_adherence}%`} />
        </div>
        <div className="rounded-md bg-slate-900 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">Composite readiness</p>
          <p className="text-3xl font-bold text-white">{scorecard.composite}</p>
          <p className="mt-1 text-sm text-slate-300">Recommended: {humanise(scorecard.recommendation).replace(/_/g, " ")}</p>
        </div>
        <div>
          <SectionLabel>Rationale</SectionLabel>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {scorecard.rationale.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function CreateScaleDecisionDialog({
  completedPilots,
  onClose,
  onCreated,
}: {
  completedPilots: Pilot[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pilotId, setPilotId] = React.useState(completedPilots[0]?.id ?? "");
  const [decision, setDecision] = React.useState<ScaleDecisionType>("gem_procurement");
  const [gemIdx, setGemIdx] = React.useState(0);
  const [budget, setBudget] = React.useState(42500000);
  const [months, setMonths] = React.useState(12);
  const [districts, setDistricts] = React.useState("Mumbai, Pune, Nagpur");
  const [population, setPopulation] = React.useState(2500000);
  const [runway, setRunway] = React.useState(true);
  const [reasoning, setReasoning] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    if (!pilotId) {
      setErr("Select a completed pilot.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createScaleDecision({
        pilot_id: pilotId,
        decision,
        reasoning: reasoning || `${DECISION_LABEL[decision]} based on validated outcomes.`,
        next_steps: "Convene Scale-Up Committee and initiate GeM category mapping.",
        budget_allocated: budget,
        timeline_months: months,
        districts: districts.split(",").map((d) => d.trim()).filter(Boolean),
        units: "district deployments",
        population_covered: population,
        gem_category: GEM_CATEGORIES[gemIdx].name,
        gem_category_code: GEM_CATEGORIES[gemIdx].code,
        gem_mode: "startup_runway",
        startup_runway_exemption: runway,
      });
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Dialog open title="New scale-up decision" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <Field label="Completed pilot">
          <select className="kilo-input" value={pilotId} onChange={(e) => setPilotId(e.target.value)}>
            {completedPilots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Decision">
          <select className="kilo-input" value={decision} onChange={(e) => setDecision(e.target.value as ScaleDecisionType)}>
            {(Object.keys(DECISION_LABEL) as ScaleDecisionType[]).map((d) => (
              <option key={d} value={d}>
                {DECISION_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="GeM category">
          <select className="kilo-input" value={gemIdx} onChange={(e) => setGemIdx(Number(e.target.value))}>
            {GEM_CATEGORIES.map((g, i) => (
              <option key={g.code} value={i}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Procurement budget (₹)">
            <input type="number" className="kilo-input" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </Field>
          <Field label="Timeline (months)">
            <input type="number" className="kilo-input" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Districts (comma separated)">
            <input className="kilo-input" value={districts} onChange={(e) => setDistricts(e.target.value)} />
          </Field>
          <Field label="Population covered">
            <input type="number" className="kilo-input" value={population} onChange={(e) => setPopulation(Number(e.target.value))} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={runway} onChange={(e) => setRunway(e.target.checked)} />
          Apply Startup Runway exemption (relaxed prior turnover/experience)
        </label>
        <Field label="Reasoning">
          <Textarea value={reasoning} onChange={setReasoning} />
        </Field>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Recording…" : "Record decision"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
