// web/src/components/government-dashboard.tsx
"use client";

import * as React from "react";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Loading,
  SectionLabel,
  StatCard,
  Table,
  Tabs,
  Tag,
  Textarea,
} from "./ui";
import {
  AchievementBar,
  Chips,
  CriterionBars,
  KpiRow,
  MilestoneStrip,
  SectorBadge,
  ScoreChip,
  StatusBadge,
} from "./shared";
import {
  assignExperts,
  createChallenge,
  createPilotFromProposal,
  fetchCurrentUser,
  fetchDashboard,
  fetchProposals,
  fetchChallenges,
  fetchExperts,
  getGfrFastTrackStatus,
  getSuccessProbabilityScore,
  maskStartupIdentity,
  releasePayment,
  setProposalStatus,
} from "@/lib/api";
import { buildPilotViews, type PilotView } from "@/lib/derive";
import { formatInrCompact, humanise } from "@/lib/utils";
import type { Challenge, DashboardData, Proposal, Sector, User } from "@/lib/types";
import { NewChallengeModal } from "./NewChallengeModal";
import { MeetingSchedulerModal } from "./MeetingSchedulerModal";
import { StartupDetailModal } from "./StartupDetailModal";
import { reviewMilestone, updatePilotProgress } from "@/lib/api";

const GOV_DEPARTMENTS = [
  "Public Works Department (PWD)",
  "Urban Development Department",
  "Water Resources Department",
  "Environment & Climate Change Department",
  "MahaRERA",
];
const GOV_DISTRICTS = [
  "Mumbai",
  "Pune",
  "Nagpur",
  "Nashik",
  "Aurangabad",
  "Konkan",
  "Thane",
  "Kolhapur",
];
const SECTORS: Sector[] = ["PWD", "Urban Waste", "Water Quality"];

export function GovernmentDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [tab, setTab] = React.useState("overview");
  const [busy, setBusy] = React.useState(false);
  const [challengeOpen, setChallengeOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const [d, u, proposals, challenges] = await Promise.all([
      fetchDashboard(),
      fetchCurrentUser(),
      fetchProposals(),
      fetchChallenges(),
    ]);
    setData({ ...d, proposals, challenges });
    setUser(u);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const q = query.trim().toLowerCase();
  const filtered: DashboardData | null = React.useMemo(() => {
    if (!data) return null;
    if (!q) return data;
    const matches = (...fields: (string | undefined)[]) =>
      fields.some((f) => f?.toLowerCase().includes(q));
    return {
      ...data,
      challenges: (data?.challenges || []).filter((c) =>
        matches(c.title, c.challenge_code, c.sector, c.department, c.problem_statement, c.district),
      ),
      proposals: (data?.proposals || []).filter((p) =>
        matches(p.title, p.startup_name, p.challenge_title, p.status),
      ),
      pilots: (data?.pilots || []).filter((p) =>
        matches(p.title, p.startup_name, p.district, p.work_order_no),
      ),
    };
  }, [data, q]);

  if (!data || !user || !filtered) return <Loading label="Loading Government dashboard…" />;

  const pendingProposals = (data?.proposals || []).filter(isGovernmentReviewCandidate);
  const openChallenges = (data?.challenges || []).filter((c) => c.status === "open");
  const activePilots = (data?.pilots || []).filter((p) => p.status === "active");
  const totalBudget = (data?.pilots || []).reduce((s, p) => s + p.budget_allocated, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Government Officer Console</h2>
          <p className="text-sm text-slate-500">
            {user.organization ?? "Maharashtra State Innovation Society"} · formulate outcome-based
            challenges, shortlist startups and track pilots against KPIs.
          </p>
        </div>
        <Button onClick={() => setChallengeOpen(true)}>+ New challenge</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open challenges" value={openChallenges.length} hint="Accepting proposals" />
        <StatCard label="Proposals in review" value={pendingProposals.length} hint="Awaiting decision" />
        <StatCard label="Active pilots" value={activePilots.length} hint="Milestone-tracked" />
        <StatCard
          label="Pilot spend (sanctioned)"
          value={formatInrCompact(totalBudget)}
          hint={`${data.pilots.length} pilots`}
        />
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
        </span>
        <input
          className="kilo-input pl-9"
          placeholder="Search challenges, proposals, pilots, startups…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {q && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-900"
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "challenges", label: `Challenges (${filtered.challenges.length})` },
          { id: "proposals", label: `Proposals (${filtered.proposals.length})` },
          { id: "pilots", label: `Pilots (${filtered.pilots.length})` },
          { id: "kpis", label: "KPIs" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <OverviewTab data={data} onOpen={(t) => setTab(t)} onRefresh={refresh} />
      )}
      {tab === "challenges" && <ChallengesTab data={filtered} onRefresh={refresh} />}
      {tab === "proposals" && <ProposalsTab data={filtered} onRefresh={refresh} />}
      {tab === "pilots" && <PilotsTab data={filtered} onRefresh={refresh} />}
      {tab === "kpis" && <KpiTab data={filtered} />}

      {challengeOpen && (
        <NewChallengeModal
          onClose={() => setChallengeOpen(false)}
          onCreated={async () => {
            setChallengeOpen(false);
            setBusy(true);
            await refresh();
            setBusy(false);
            setToast("Challenge created successfully.");
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      {busy && <Loading label="Working…" />}
    </div>
  );
}

/* ------------------------------ Overview --------------------------------- */

function OverviewTab({
  data,
  onOpen,
  onRefresh,
}: {
  data: DashboardData;
  onOpen: (tab: string) => void;
  onRefresh: () => void;
}) {
  const needsDecision = (data?.proposals || []).filter(isGovernmentReviewCandidate);
  const views = buildPilotViews(data);
  const atRisk = views.filter((v) => v.riskLevel === "high");
  const scaleReady = views.filter((v) => v.scaleReadiness === "ready");

  return (
    <div className="space-y-6">
      <PipelineCard data={data} onOpen={onOpen} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionLabel>Proposals awaiting your decision</SectionLabel>
          {needsDecision.length === 0 ? (
            <EmptyState title="Nothing pending" hint="All proposals have been triaged." />
          ) : (
            <div className="mt-3 space-y-2">
              {needsDecision.slice(0, 6).map((p) => (
                <ProposalRow key={p.id} p={p} onChanged={onRefresh} />
              ))}
            </div>
          )}
          <button
            className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900"
            onClick={() => onOpen("proposals")}
          >
            View all proposals →
          </button>
        </Card>

        <Card>
          <SectionLabel>Attention required</SectionLabel>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Open challenges</span>
              <button className="font-semibold text-slate-900" onClick={() => onOpen("challenges")}>
                {(data?.challenges || []).filter((c) => c.status === "open").length}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Pilots at risk</span>
              <button
                className={atRisk.length ? "font-semibold text-red-600" : "font-semibold text-slate-900"}
                onClick={() => onOpen("pilots")}
              >
                {atRisk.length}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Scale-up ready</span>
              <button className="font-semibold text-emerald-600" onClick={() => onOpen("pilots")}>
                {scaleReady.length}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Outcome contracts</p>
            <p className="mt-1">
              Budgets are released against verified KPI milestones, not inputs. Use the Pilots tab to
              inspect tranche status and readiness for GeM procurement.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function isGovernmentReviewCandidate(proposal: Proposal): boolean {
  return (
    (proposal.evaluations_count ?? 0) > 0 &&
    (proposal.panel_recommendation === "accept" || proposal.panel_recommendation === "strongly_accept") &&
    ["submitted", "under_review"].includes(proposal.status)
  );
}

function PipelineCard({
  data,
  onOpen,
}: {
  data: DashboardData;
  onOpen: (tab: string) => void;
}) {
  const stages = [
    {
      label: "Draft",
      hint: "Shape the problem",
      count: data.challenges.filter((challenge) => challenge.status === "draft").length,
      tab: "challenges",
    },
    {
      label: "Published",
      hint: "Accepting proposals",
      count: data.challenges.filter((challenge) => challenge.status === "open").length,
      tab: "challenges",
    },
    {
      label: "Evaluation",
      hint: "Expert review",
      count: data.proposals.filter((proposal) => ["submitted", "under_review"].includes(proposal.status)).length,
      tab: "proposals",
    },
    {
      label: "Pilot",
      hint: "Milestones active",
      count: data.pilots.filter((pilot) => pilot.status === "active").length,
      tab: "pilots",
    },
    {
      label: "Scale",
      hint: "Ready to expand",
      count: buildPilotViews(data).filter((pilot) => pilot.scaleReadiness === "ready").length,
      tab: "pilots",
    },
  ];

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Innovation pipeline</SectionLabel>
          <p className="mt-1 text-xs text-slate-500">
            From a public-sector problem statement to a validated scale-up decision.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Human approval at every gate
        </span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {stages.map((stage, index) => (
          <div key={stage.label} className="relative">
            <button
              className="group rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:shadow-sm"
              onClick={() => onOpen(stage.tab)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">{stage.label}</span>
                <span className="text-lg font-semibold tracking-tight text-slate-950">{stage.count}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{stage.hint}</p>
            </button>
            {index < stages.length - 1 && (
              <span className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 sm:block" aria-hidden="true">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ Challenges ------------------------------- */

function ChallengesTab({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const [open, setOpen] = React.useState<Challenge | null>(null);
  const proposalCountByChallenge = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of (data?.proposals || [])) map[p.challenge_id] = (map[p.challenge_id] ?? 0) + 1;
    return map;
  }, [data?.proposals]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data?.challenges || []).map((c) => (
          <Card key={c.id} className="cursor-pointer hover:border-slate-300" onClick={() => setOpen(c)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SectorBadge sector={c.sector} />
                  <span className="font-mono text-xs text-slate-400">{c.challenge_code}</span>
                </div>
                <h3 className="mt-1 truncate text-sm font-semibold">{c.title}</h3>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">{c.problem_statement}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{c.department}</span>
              <span>· {c.district ?? "Statewide"}</span>
              <span>· {c.submission_deadline ? relativeDeadline(c.submission_deadline) : "no deadline"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                {formatInrCompact(c.budget_min)}–{formatInrCompact(c.budget_max)}
              </span>
              <span className="text-xs text-slate-500">
                {proposalCountByChallenge[c.id] ?? 0} proposals
              </span>
            </div>
          </Card>
        ))}
      </div>

      {open && <ChallengeDetail challenge={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ChallengeDetail({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  return (
    <Dialog open title={challenge.title} onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SectorBadge sector={challenge.sector} />
          <StatusBadge status={challenge.status} />
          <Tag>{challenge.msins_programme ?? "MSINS"}</Tag>
        </div>
        <div>
          <SectionLabel>Problem statement</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{challenge.problem_statement}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Desired outcomes">
            <p className="text-sm">{challenge.desired_outcomes}</p>
          </Field>
          <Field label="Success criteria">
            <p className="text-sm">{challenge.success_criteria}</p>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pilot budget" value={`${formatInrCompact(challenge.budget_min)}–${formatInrCompact(challenge.budget_max)}`} />
          <Stat label="Department" value={challenge.department} />
          <Stat label="Deadline" value={challenge.submission_deadline ? relativeDeadline(challenge.submission_deadline) : "—"} />
          <Stat label="Code" value={challenge.challenge_code} />
        </div>
        {challenge.outcome_targets.length > 0 && (
          <div>
            <SectionLabel>Outcome targets (KPI-linked)</SectionLabel>
            <div className="mt-2 space-y-2">
              {challenge.outcome_targets.map((ot) => (
                <div key={ot.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-medium">{ot.statement}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Baseline: {ot.baseline} · Target: {ot.target} · Method: {ot.measurement_method}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <Chips
          items={[
            challenge.eligibility.dpiit_required ? "DPIIT recognition required" : undefined,
            `Min TRL ${challenge.eligibility.min_trl}`,
            challenge.eligibility.maharashtra_presence_required
              ? "Maharashtra presence required"
              : undefined,
          ]}
        />
      </div>
    </Dialog>
  );
}

/* ------------------------------ Proposals -------------------------------- */

function ProposalsTab({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const [status, setStatus] = React.useState("all");
  const [open, setOpen] = React.useState<Proposal | null>(null);

  const visibleToGovernment = (data?.proposals || []).filter(
    (proposal) =>
      isGovernmentReviewCandidate(proposal) ||
      ["shortlisted", "rejected", "piloting", "completed", "scaled"].includes(proposal.status),
  );
  const filtered =
    status === "all" ? visibleToGovernment : visibleToGovernment.filter((p) => p.status === status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "under_review", "shortlisted", "rejected", "piloting", "completed", "scaled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-md border px-3 py-1 text-xs font-medium ${
              status === s
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {s === "all" ? "Government queue" : humanise(s)}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Startup / Proposal</Th>
              <Th>Challenge</Th>
              <Th>Ask</Th>
              <Th>Panel score</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(p)}>
                <td className="font-medium text-slate-900">
                  {maskStartupIdentity(p.startup_org ?? p.startup_name ?? p.title)}
                </td>
                <td className="text-slate-500">
                  <div>{p.challenge_title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(() => {
                      const score = p.ai_score ?? p.success_probability ?? getSuccessProbabilityScore(p);
                      const eligible = p.gfr_eligible ?? p.eligible_for_direct_gfr_exemption ?? getGfrFastTrackStatus(p).eligible;
                      return (
                        <>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${score > 80 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                            AI Success Score: {score}%
                          </span>
                          {eligible && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">⚡ GFR Exemption Eligible</span>}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="font-mono text-slate-700">{formatInrCompact(p.budget_estimate)}</td>
                <td>
                  <ScoreChip value={p.weighted_score} count={p.evaluations_count} />
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="text-right text-slate-400">→</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {open && <ProposalDetail proposal={open} onClose={() => setOpen(null)} onChanged={onRefresh} />}
    </div>
  );
}

function ProposalRow({ p, onChanged }: { p: Proposal; onChanged: () => void }) {
  const gfr = getGfrFastTrackStatus(p);
  const successProbability = p.ai_score ?? p.success_probability ?? getSuccessProbabilityScore(p);
  const gfrEligible = p.gfr_eligible ?? p.eligible_for_direct_gfr_exemption ?? gfr.eligible;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {maskStartupIdentity(p.startup_org ?? p.startup_name ?? p.title)}
        </p>
        <p className="truncate text-xs text-slate-500">
          {p.challenge_title} · {formatInrCompact(p.budget_estimate)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className={`rounded px-1.5 py-0.5 font-semibold ${successProbability > 80 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
            AI Success Score: {successProbability}%
          </span>
          {gfrEligible && <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">⚡ GFR Exemption Eligible</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ScoreChip value={p.weighted_score} count={p.evaluations_count} />
        <ProposalActions proposal={p} onChanged={onChanged} />
      </div>
    </div>
  );
}

function ProposalActions({ proposal, onChanged }: { proposal: Proposal; onChanged: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const decidable = ["submitted", "under_review"].includes(proposal.status);
  if (!decidable) return <StatusBadge status={proposal.status} />;

  async function act(status: "shortlisted" | "rejected") {
    setBusy(true);
    await setProposalStatus(proposal.id, status);
    setBusy(false);
    onChanged();
  }
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="success" disabled={busy} onClick={() => act("shortlisted")}>
        Shortlist
      </Button>
      <Button size="sm" variant="danger" disabled={busy} onClick={() => act("rejected")}>
        Reject
      </Button>
    </div>
  );
}

function ProposalDetail({
  proposal,
  onClose,
  onChanged,
}: {
  proposal: Proposal;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [pilotOpen, setPilotOpen] = React.useState(false);
  const decidable = ["submitted", "under_review"].includes(proposal.status);
  const gfr = getGfrFastTrackStatus(proposal);
  const successProbability = getSuccessProbabilityScore(proposal);

  return (
    <Dialog open title={`${maskStartupIdentity(proposal.startup_org ?? proposal.startup_name ?? proposal.title)} · proposal`} onClose={onClose} width="max-w-3xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={proposal.status} />
          {proposal.dpiit_verified && (
            <Tag tone="success">DPIIT verified ({proposal.dpiit_number ?? "—"})</Tag>
          )}
          {gfr.eligible && <Tag tone="success">GFR fast-track · ₹{formatInrCompact(gfr.max_pilot_budget_inr)}</Tag>}
          <Tag>{proposal.challenge_title}</Tag>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-medium">AI Predictive Success Score</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">{successProbability}%</span>
        </div>

        <p className="text-sm text-slate-700">{proposal.description || proposal.solution_approach}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Requested" value={formatInrCompact(proposal.budget_estimate)} />
          <Stat label="Timeline" value={`${proposal.timeline_weeks} wk`} />
          <Stat label="TRL" value={String(proposal.trl_level)} />
          <Stat label="Reviews" value={String(proposal.evaluations_count ?? 0)} />
        </div>

        <div>
          <SectionLabel>Independent evaluation panel</SectionLabel>
          <div className="mt-2 rounded-md border border-slate-100 p-3">
            <CriterionBars scores={proposal.criterion_scores} />
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <ScoreChip value={proposal.weighted_score} count={proposal.evaluations_count} />
              <span className="text-xs text-slate-500">
                Recommendation:{" "}
                <span className="font-medium">
                  {proposal.panel_recommendation ? humanise(proposal.panel_recommendation) : "pending panel"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {proposal.status === "shortlisted" && (
          <div className="flex flex-wrap gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            <span>Shortlisted. Next steps:</span>
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              Convene panel
            </Button>
            <Button size="sm" onClick={() => setPilotOpen(true)}>
              Create pilot
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          {decidable && (
            <>
              <Button
                variant="danger"
                onClick={async () => {
                  await setProposalStatus(proposal.id, "rejected");
                  onClose();
                  onChanged();
                }}
              >
                Reject
              </Button>
              <Button
                variant="success"
                onClick={async () => {
                  await setProposalStatus(proposal.id, "shortlisted");
                  onChanged();
                }}
              >
                Shortlist
              </Button>
            </>
          )}
        </div>
      </div>

      {assignOpen && (
        <AssignExpertDialog
          proposalId={proposal.id}
          onClose={() => setAssignOpen(false)}
          onDone={() => {
            setAssignOpen(false);
            onChanged();
          }}
        />
      )}
      {pilotOpen && (
        <CreatePilotDialog
          proposal={proposal}
          onClose={() => setPilotOpen(false)}
          onDone={() => {
            setPilotOpen(false);
            onClose();
            onChanged();
          }}
        />
      )}
    </Dialog>
  );
}

/* ------------------------------ Pilots ----------------------------------- */

function PilotsTab({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const views = buildPilotViews(data);
  const open = views.find((v) => v.pilot.id === openId) ?? null;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {views.map((v) => (
          <Card
            key={v.pilot.id}
            className="cursor-pointer hover:border-slate-300"
            onClick={() => setOpenId(v.pilot.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{v.pilot.title}</p>
                <p className="text-xs text-slate-500">
                  {v.pilot.startup_name} · {v.pilot.district}
                </p>
              </div>
              <StatusBadge status={v.pilot.status} />
            </div>
            <div className="mt-3">
              <MilestoneStrip milestones={v.milestones} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Budget {formatInrCompact(v.pilot.budget_allocated)}</span>
              <span>
                Spent {formatInrCompact(v.pilot.budget_spent)} · {v.milestonesPaid}/
                {v.milestones.length} paid
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">KPI achievement</span>
              <AchievementBar value={v.kpiAchievementAvg} />
            </div>
            {v.scaleReadiness === "ready" && (
              <div className="mt-2 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                Scale-up ready · GeM pathway open
              </div>
            )}
          </Card>
        ))}
      </div>

      {open && <PilotDetail view={open} onClose={() => setOpenId(null)} onChanged={onRefresh} />}
    </div>
  );
}

function PilotDetail({
  view,
  onClose,
  onChanged,
}: {
  view: PilotView;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { pilot, milestones, kpis } = view;
  const [meetingModal, setMeetingModal] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [progressVal, setProgressVal] = React.useState(pilot.progress_percentage || 35);

  async function handleMilestoneReview(id: string, decision: "approved" | "rejected") {
    setBusy(true);
    await reviewMilestone(id, decision, decision === "approved" ? "Milestone deliverables verified and approved by Department." : "Deliverables incomplete or rejected.");
    setBusy(false);
    onChanged();
  }

  async function handleUpdateProgress() {
    setBusy(true);
    await updatePilotProgress(pilot.id, progressVal);
    setBusy(false);
    onChanged();
  }

  return (
    <Dialog open title={pilot.title ?? "Pilot"} onClose={onClose} width="max-w-3xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={pilot.status} />
            <Tag>{pilot.startup_name}</Tag>
            <Tag>{pilot.district}</Tag>
            <Tag tone={view.scaleReadiness === "ready" ? "success" : "default"}>
              Scale: {humanise(view.scaleReadiness)}
            </Tag>
            <Tag tone={view.riskLevel === "high" ? "danger" : "default"}>Risk: {humanise(view.riskLevel)}</Tag>
          </div>
          <Button size="sm" variant="outline" onClick={() => setMeetingModal(true)}>
            📅 Schedule Alignment Meeting
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Budget" value={formatInrCompact(pilot.budget_allocated)} />
          <Stat label="Spent" value={formatInrCompact(pilot.budget_spent)} />
          <Stat label="Milestones" value={`${view.milestonesPaid}/${milestones.length}`} />
          <Stat label="Risk" value={humanise(view.riskLevel)} />
        </div>

        {/* Work Live Tracking */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>📡 Work Live Tracking & Progress</span>
            <span className="text-slate-900 font-bold">{pilot.progress_percentage}% Executed</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${pilot.progress_percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Work Order: {pilot.work_order_no || "MSINS/WO/2026/012"}</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer"
              />
              <Button size="sm" variant="outline" disabled={busy} onClick={handleUpdateProgress}>
                Save %
              </Button>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Milestone-linked tranches & Evidence</SectionLabel>
          <div className="mt-2 space-y-2">
            {milestones.map((m) => (
              <div key={m.id} className="rounded-md border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      M{m.seq} · {m.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatInrCompact(m.amount)} ({m.payment_percentage}%) · due {m.due_date ? relativeDeadline(m.due_date) : "—"}
                      {m.payment_utr && ` · UTR: ${m.payment_utr}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    {m.status === "submitted" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          disabled={busy}
                          onClick={() => handleMilestoneReview(m.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => handleMilestoneReview(m.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {m.status === "approved" && (
                      <Button
                        size="sm"
                        variant="success"
                        disabled={busy}
                        onClick={async () => {
                          await releasePayment(m.id);
                          onChanged();
                        }}
                      >
                        Release Payment
                      </Button>
                    )}
                  </div>
                </div>

                {m.evidence && m.evidence.length > 0 && (
                  <div className="rounded bg-slate-50 p-2 text-xs border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-1">Uploaded Evidence / Deliverables:</span>
                    <div className="flex flex-wrap gap-2">
                      {m.evidence.map((ev: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] border border-slate-200 text-slate-700">
                          📄 {ev.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>KPI measurement</SectionLabel>
          <div className="mt-2 space-y-2">
            {kpis.length === 0 && <p className="text-xs text-slate-400">No KPIs defined for this pilot.</p>}
            {kpis.map((k) => (
              <KpiRow key={k.id} kpi={k} />
            ))}
          </div>
        </div>
      </div>

      {meetingModal && (
        <MeetingSchedulerModal
          pilotId={pilot.id}
          pilotTitle={pilot.title}
          onClose={() => setMeetingModal(false)}
          onScheduled={() => {
            setMeetingModal(false);
            onChanged();
          }}
        />
      )}
    </Dialog>
  );
}

/* -------------------------------- KPIs ----------------------------------- */

function KpiTab({ data }: { data: DashboardData }) {
  const views = buildPilotViews(data);
  const rows = views.flatMap((v) =>
    v.kpis.map((k) => ({ pilot: v.pilot.title, k })),
  );
  return (
    <Card>
      <SectionLabel>All pilot KPIs</SectionLabel>
      <div className="mt-3 space-y-3">
        {rows.map(({ pilot, k }) => (
          <div key={k.id} className="rounded-md border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{k.name}</p>
                <p className="text-xs text-slate-400">{pilot}</p>
              </div>
              <AchievementBar value={kpiAchievement(k)} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-400">No KPIs recorded yet.</p>}
      </div>
    </Card>
  );
}

import { kpiAchievement } from "@/lib/api";
import { relativeDeadline } from "@/lib/utils";

/* ------------------------------- Dialogs --------------------------------- */

function CreateChallengeDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    title: "",
    sector: "PWD" as Sector,
    department: GOV_DEPARTMENTS[0],
    district: "Mumbai",
    problem_statement: "",
    outcome_metric: "",
    expected_impact: "",
    pilot_budget_min: 500000,
    pilot_budget_max: 50000000,
    submission_deadline: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.title || !form.problem_statement || !form.outcome_metric) {
      setErr("Title, problem statement and outcome metric are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createChallenge({
        ...form,
        programme: "MSINS Innovation Challenge",
      });
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Dialog open title="New outcome-based challenge" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <Field label="Title">
          <input className="kilo-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sector">
            <select className="kilo-input" value={form.sector} onChange={(e) => set("sector", e.target.value as Sector)}>
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="District">
            <select className="kilo-input" value={form.district} onChange={(e) => set("district", e.target.value)}>
              {GOV_DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Department">
          <select className="kilo-input" value={form.department} onChange={(e) => set("department", e.target.value)}>
            {GOV_DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Problem statement">
          <Textarea value={form.problem_statement} onChange={(v) => set("problem_statement", v)} />
        </Field>
        <Field label="Outcome / success metric (KPI-linked)">
          <Textarea value={form.outcome_metric} onChange={(v) => set("outcome_metric", v)} />
        </Field>
        <Field label="Expected impact">
          <Textarea value={form.expected_impact} onChange={(v) => set("expected_impact", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pilot budget min (₹)">
            <input
              type="number"
              className="kilo-input"
              value={form.pilot_budget_min}
              onChange={(e) => set("pilot_budget_min", Number(e.target.value))}
            />
          </Field>
          <Field label="Pilot budget max (₹)">
            <input
              type="number"
              className="kilo-input"
              value={form.pilot_budget_max}
              onChange={(e) => set("pilot_budget_max", Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Submission deadline">
          <input
            type="date"
            className="kilo-input"
            value={form.submission_deadline}
            onChange={(e) => set("submission_deadline", e.target.value)}
          />
        </Field>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create challenge"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function AssignExpertDialog({
  proposalId,
  onClose,
  onDone,
}: {
  proposalId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [experts, setExperts] = React.useState<User[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetchExperts().then(setExperts);
  }, []);

  function toggle(id: string) {
    setChecked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function submit() {
    if (checked.size === 0) return;
    setBusy(true);
    await assignExperts(proposalId, Array.from(checked));
    setBusy(false);
    onDone();
  }

  return (
    <Dialog open title="Convene evaluation panel" onClose={onClose} width="max-w-lg">
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Select 2–5 independent experts. The platform enforces domain fit and conflict-of-interest
          recusal automatically.
        </p>
        {experts.map((e) => (
          <label key={e.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
            <div>
              <p className="text-sm font-medium">{e.full_name}</p>
              <p className="text-xs text-slate-500">
                {(e.expertise ?? "").split(",").slice(0, 3).join(", ")} · {e.organization}
              </p>
            </div>
            <input type="checkbox" checked={checked.has(e.id)} onChange={() => toggle(e.id)} />
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || checked.size === 0}>
            {busy ? "Assigning…" : `Assign ${checked.size} expert(s)`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function CreatePilotDialog({
  proposal,
  onClose,
  onDone,
}: {
  proposal: Proposal;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = React.useState(`${proposal.startup_name ?? proposal.title} pilot`);
  const [duration, setDuration] = React.useState(9);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    setBusy(true);
    await createPilotFromProposal(proposal.id, {
      title: name,
      duration_months: duration,
    });
    setBusy(false);
    onDone();
  }

  return (
    <Dialog open title="Create pilot from proposal" onClose={onClose} width="max-w-lg">
      <div className="space-y-3">
        <Field label="Pilot name">
          <input className="kilo-input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Duration (months)">
          <input
            type="number"
            className="kilo-input"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </Field>
        <p className="text-xs text-slate-500">
          Budget of {formatInrCompact(proposal.budget_estimate)} will be scheduled into KPI-linked
          tranches. Milestone payments require Platform Admin approval.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create pilot"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------- helpers --------------------------------- */

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}