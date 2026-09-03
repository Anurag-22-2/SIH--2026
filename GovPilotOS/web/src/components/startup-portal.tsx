// web/src/components/startup-portal.tsx
"use client";

import * as React from "react";
import {
  Alert,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Loading,
  SectionLabel,
  StatCard,
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
  createProposal,
  fetchChallenges,
  fetchProposals,
  fetchStartupPortal,
  signAgreement,
  submitMilestone,
} from "@/lib/api";
import { ProposalFormModal } from "./ProposalFormModal";
import { ContractSigningModal } from "./ContractSigningModal";
import { groupByPilot } from "@/lib/derive";
import { formatInrCompact, formatCurrency, humanise, relativeDeadline } from "@/lib/utils";
import type { Challenge, Milestone, Proposal, StartupPortalData } from "@/lib/types";

export function StartupPortal() {
  const [data, setData] = React.useState<StartupPortalData | null>(null);
  const [tab, setTab] = React.useState("overview");
  const [busy, setBusy] = React.useState(false);
  const [isDpiitVerified, setIsDpiitVerified] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const [portal, proposals, challenges] = await Promise.all([
      fetchStartupPortal(),
      fetchProposals(),
      fetchChallenges(),
    ]);
    const currentUserId = portal.profile.id;
    setData({
      ...portal,
      availableChallenges: challenges.filter((challenge) => ["open", "in_review"].includes(challenge.status)),
      myProposals: proposals.filter((proposal) => proposal.startup_id === currentUserId),
    });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (data?.profile.dpiit_verified) setIsDpiitVerified(true);
  }, [data?.profile.dpiit_verified]);

  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!data) return <Loading label="Loading Startup portal…" />;

  const profile = data.profile;
  const payable = data.myMilestones.filter(
    (m) => m.status === "pending" || m.status === "in_progress" || m.status === "submitted",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Startup Portal</h2>
          <p className="text-sm text-slate-500">
            {profile.organization ?? profile.full_name} · discover MSINS challenges, submit DPIIT-backed
            proposals and track milestone payments.
          </p>
        </div>
        <Button onClick={() => setTab("discover")}>+ Find challenges</Button>
      </div>

      {!isDpiitVerified && (
        <Alert variant="destructive">
          DPIIT recognition is not verified on your profile. The Platform Admin must verify your DPIIT
          number before you can submit a pilot funding proposal. You can still browse challenges and
          prepare drafts.
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => setIsDpiitVerified(true)}>
              Verify DPIIT (demo)
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open challenges" value={data.availableChallenges.length} hint="Available to apply" />
        <StatCard label="My proposals" value={data.myProposals.length} hint="Submitted" />
        <StatCard label="Active pilots" value={data.myPilots.length} hint="Underway" />
        <StatCard label="Milestones to submit" value={payable} hint="Awaiting evidence" />
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "discover", label: `Discover (${data.availableChallenges.length})` },
          { id: "proposals", label: `My proposals (${data.myProposals.length})` },
          { id: "pilots", label: `My pilots (${data.myPilots.length})` },
          { id: "agreements", label: `Agreements (${data.myAgreements.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && <OverviewTab data={data} onOpen={(t) => setTab(t)} />}
      {tab === "discover" && (
        <DiscoverTab
          data={data}
          isDpiitVerified={isDpiitVerified}
          onCreated={async () => {
            await refresh();
            setTab("proposals");
            setToast("Proposal submitted successfully.");
          }}
        />
      )}
      {tab === "proposals" && <MyProposalsTab data={data} onChanged={refresh} />}
      {tab === "pilots" && <MyPilotsTab data={data} onChanged={refresh} />}
      {tab === "agreements" && <AgreementsTab data={data} onChanged={refresh} />}

      {busy && <Loading label="Working…" />}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Overview --------------------------------- */

function OverviewTab({ data, onOpen }: { data: StartupPortalData; onOpen: (t: string) => void }) {
  const profile = data.profile;
  const latestDecision = data.myProposals.find((p) => p.panel_recommendation);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <SectionLabel>Your pipeline</SectionLabel>
        <div className="mt-3 space-y-2">
          {data.myProposals.slice(0, 4).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-slate-500">{p.challenge_title}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {data.myProposals.length === 0 && (
            <EmptyState title="No proposals yet" hint="Discover an MSINS challenge to get started." />
          )}
        </div>
        <button className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => onOpen("discover")}>
          Browse open challenges →
        </button>
      </Card>

      <Card>
        <SectionLabel>Profile & compliance</SectionLabel>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Entity" value={profile.organization ?? profile.full_name} />
          <Row label="DPIIT" value={profile.dpiit_number ?? "—"} />
          <Row
            label="DPIIT status"
            value={profile.dpiit_verified ? "Verified" : "Pending verification"}
            tone={profile.dpiit_verified ? "success" : "danger"}
          />
          <Row label="GSTIN" value={profile.gstin ?? "—"} />
          <Row label="CIN" value={profile.cin ?? "—"} />
        </div>
        {latestDecision && (
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            Latest panel recommendation:{" "}
            <span className="font-semibold">{humanise(latestDecision.panel_recommendation!)}</span>{" "}
            ({latestDecision.weighted_score?.toFixed(2) ?? "—"} / 5)
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          tone === "success" ? "font-medium text-emerald-600" : tone === "danger" ? "font-medium text-red-600" : "font-medium text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------ Discover --------------------------------- */

function DiscoverTab({ data, isDpiitVerified, onCreated }: { data: StartupPortalData; isDpiitVerified: boolean; onCreated: () => void }) {
  const [applyChallenge, setApplyChallenge] = React.useState<Challenge | null>(null);
  const [detailOpen, setDetailOpen] = React.useState<Challenge | null>(null);
  const [query, setQuery] = React.useState("");
  const [sector, setSector] = React.useState("all");
  const [budget, setBudget] = React.useState("all");
  const filtered = data.availableChallenges.filter((challenge) => {
    const matchesQuery = !query.trim() || [challenge.title, challenge.department, challenge.district, challenge.problem_statement]
      .some((value) => value?.toLowerCase().includes(query.trim().toLowerCase()));
    const matchesSector = sector === "all" || challenge.sector === sector;
    const matchesBudget = budget === "all"
      || (budget === "under-1cr" && challenge.budget_max < 10000000)
      || (budget === "over-1cr" && challenge.budget_max >= 10000000);
    return matchesQuery && matchesSector && matchesBudget;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Outcome-based challenges open for DPIIT-recognised startups.
        </p>
        <Button onClick={() => setApplyChallenge(filtered[0] ?? null)} disabled={!isDpiitVerified || filtered.length === 0}>
          Submit proposal
        </Button>
      </div>
      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_180px]">
        <input className="kilo-input" placeholder="Search challenges, departments, locations…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="kilo-input" value={sector} onChange={(event) => setSector(event.target.value)}>
          <option value="all">All sectors</option>
          {Array.from(new Set(data.availableChallenges.map((challenge) => challenge.sector))).map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className="kilo-input" value={budget} onChange={(event) => setBudget(event.target.value)}>
          <option value="all">Any pilot budget</option>
          <option value="under-1cr">Under ₹1 Cr</option>
          <option value="over-1cr">₹1 Cr and above</option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="cursor-pointer hover:border-slate-300"
            onClick={() => setDetailOpen(c)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SectorBadge sector={c.sector} />
                  <span className="font-mono text-xs text-slate-400">{c.challenge_code}</span>
                </div>
                <h3 className="mt-1 text-sm font-semibold">{c.title}</h3>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-2 line-clamp-3 text-xs text-slate-500">{c.problem_statement}</p>
            <div className="mt-3 text-xs text-slate-500">
              {formatInrCompact(c.budget_min)}–{formatInrCompact(c.budget_max)} · {c.district ?? "Statewide"}
            </div>
            {c.outcome_targets.length > 0 && (
              <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
                Target: {c.outcome_targets[0].target}
              </div>
            )}
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={!isDpiitVerified}
              onClick={(e) => {
                e.stopPropagation();
                setApplyChallenge(c);
              }}
            >
              Apply
            </Button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <EmptyState title="No matching challenges" hint="Try changing the filters or check back when a new MSINS challenge is published." />
        )}
      </div>

      {detailOpen && (
        <ChallengeDetail
          challenge={detailOpen}
          onStartApplication={() => {
            setApplyChallenge(detailOpen);
            setDetailOpen(null);
          }}
          onClose={() => setDetailOpen(null)}
        />
      )}

      {applyChallenge && (
        <ProposalFormModal
          challenge={applyChallenge}
          open
          onClose={() => setApplyChallenge(null)}
          onSubmitted={() => {
            setApplyChallenge(null);
            onCreated();
          }}
        />
      )}
    </div>
  );
}

function ChallengeDetail({
  challenge,
  onStartApplication,
  onClose,
}: {
  challenge: Challenge;
  onStartApplication: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open title={challenge.title} onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SectorBadge sector={challenge.sector} />
          <StatusBadge status={challenge.status} />
          <Tag tone="info">{challenge.challenge_code}</Tag>
          <Tag tone={challenge.priority === "critical" ? "danger" : challenge.priority === "high" ? "warning" : "default"}>
            {challenge.priority}
          </Tag>
        </div>

        <div>
          <SectionLabel>Overview</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{challenge.description}</p>
        </div>

        <div>
          <SectionLabel>Problem statement</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{challenge.problem_statement}</p>
        </div>

        <div>
          <SectionLabel>Desired outcomes</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{challenge.desired_outcomes}</p>
        </div>

        <div>
          <SectionLabel>Success criteria</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{challenge.success_criteria}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Budget" value={`${formatInrCompact(challenge.budget_min)}–${formatInrCompact(challenge.budget_max)}`} />
          <Stat label="Department" value={challenge.department} />
          <Stat label="District" value={challenge.district ?? "Statewide"} />
          <Stat label="Deadline" value={relativeDeadline(challenge.submission_deadline)} />
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

        <div>
          <SectionLabel>Eligibility</SectionLabel>
          <Chips
            items={[
              challenge.eligibility.dpiit_required ? "DPIIT recognition required" : undefined,
              `Min TRL ${challenge.eligibility.min_trl}`,
              challenge.eligibility.maharashtra_presence_required
                ? "Maharashtra presence required"
                : undefined,
              ...challenge.eligibility.conditions,
            ]}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onStartApplication}>Apply to this challenge</Button>
        </div>
      </div>
    </Dialog>
  );
}

function SubmitProposalDialog({
  challenges,
  defaultChallengeId,
  profile,
  onClose,
  onCreated,
}: {
  challenges: Challenge[];
  defaultChallengeId?: string;
  profile: StartupPortalData["profile"];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [challengeId, setChallengeId] = React.useState(defaultChallengeId ?? challenges[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [approach, setApproach] = React.useState("");
  const [budget, setBudget] = React.useState(2500000);
  const [weeks, setWeeks] = React.useState(18);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    if (!challengeId || !title) {
      setErr("Select a challenge and provide a proposal title.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createProposal({
        challenge_id: challengeId,
        title,
        summary,
        solution_approach: approach,
        budget_estimate: budget,
        timeline_weeks: weeks,
      });
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Dialog open title="Submit pilot funding proposal" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <Field label="Challenge">
          <select className="kilo-input" value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.challenge_code} — {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proposal title">
          <input className="kilo-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Summary">
          <Textarea value={summary} onChange={setSummary} />
        </Field>
        <Field label="Solution approach">
          <Textarea value={approach} onChange={setApproach} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget estimate (₹)">
            <input type="number" className="kilo-input" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </Field>
          <Field label="Timeline (weeks)">
            <input type="number" className="kilo-input" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
          </Field>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <SectionLabel>Compliance snapshot (from your registration)</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between"><span>DPIIT</span><span className="font-medium">{profile.dpiit_number ?? "—"}</span></div>
            <div className="flex justify-between"><span>DPIIT status</span><span className={profile.dpiit_verified ? "font-medium text-emerald-600" : "font-medium text-red-600"}>{profile.dpiit_verified ? "Verified" : "Pending admin verification"}</span></div>
            <div className="flex justify-between"><span>CIN</span><span className="font-medium">{profile.cin ?? "—"}</span></div>
            <div className="flex justify-between"><span>GSTIN</span><span className="font-medium">{profile.gstin ?? "—"}</span></div>
            <div className="flex justify-between"><span>Annual turnover</span><span className="font-medium">{profile.annual_turnover ? formatInrCompact(profile.annual_turnover) : "—"}</span></div>
            <div className="flex justify-between"><span>Profit / Loss</span><span className={profile.annual_profit_loss ? (profile.annual_profit_loss >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600") : ""}>{profile.annual_profit_loss ? formatCurrency(profile.annual_profit_loss) : "—"}</span></div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          On submit, a milestone payment plan (20/30/50) is generated and routed to an independent
          expert panel. You must accept the data-handling and IP clauses of the pilot agreement.
        </p>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit proposal"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ---------------------------- My proposals ------------------------------ */

function MyProposalsTab({ data, onChanged }: { data: StartupPortalData; onChanged: () => void }) {
  const [open, setOpen] = React.useState<Proposal | null>(null);
  return (
    <div className="space-y-4">
      {data.myProposals.length === 0 ? (
        <EmptyState title="No proposals submitted" hint="Apply to a challenge from the Discover tab." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.myProposals.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:border-slate-300" onClick={() => setOpen(p)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.challenge_title}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{formatInrCompact(p.budget_estimate)}</span>
                <ScoreChip value={p.weighted_score} count={p.evaluations_count} />
              </div>
            </Card>
          ))}
        </div>
      )}
      {open && <ProposalFeedback proposal={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ProposalFeedback({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <Dialog open title={`Panel feedback · ${proposal.title}`} onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={proposal.status} />
          {proposal.panel_recommendation && (
            <Tag tone={proposal.panel_recommendation.includes("reject") ? "danger" : "success"}>
              {humanise(proposal.panel_recommendation)}
            </Tag>
          )}
        </div>
        <div>
          <SectionLabel>Evaluation matrix (consensus)</SectionLabel>
          <div className="mt-2 rounded-md border border-slate-100 p-3">
            <CriterionBars scores={proposal.criterion_scores} />
            <div className="mt-3 border-t border-slate-100 pt-3">
              <ScoreChip value={proposal.weighted_score} count={proposal.evaluations_count} />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Scores shown are the panel consensus. Individual evaluator identities remain confidential;
          conflict-of-interest recusals are excluded automatically.
        </p>
      </div>
    </Dialog>
  );
}

/* ------------------------------ My pilots ------------------------------- */

function MyPilotsTab({ data, onChanged }: { data: StartupPortalData; onChanged: () => void }) {
  const [milestoneOpen, setMilestoneOpen] = React.useState<Milestone | null>(null);
  const milestonesByPilot = React.useMemo(() => groupByPilot(data.myMilestones), [data.myMilestones]);
  const kpisByPilot = React.useMemo(() => groupByPilot(data.myKpis), [data.myKpis]);

  return (
    <div className="space-y-4">
      {data.myPilots.length === 0 ? (
        <EmptyState title="No pilots yet" hint="Shortlisted proposals become pilots after work-order issuance." />
      ) : (
        data.myPilots.map((pilot) => {
          const milestones = (milestonesByPilot[pilot.id] ?? []).sort((a, b) => a.seq - b.seq);
          const kpis = kpisByPilot[pilot.id] ?? [];
          const paid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
          return (
            <Card key={pilot.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{pilot.title}</p>
                  <p className="text-xs text-slate-500">{pilot.work_order_no} · {pilot.district}</p>
                </div>
                <StatusBadge status={pilot.status} />
              </div>
              <div className="mt-3">
                <MilestoneStrip milestones={milestones} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Disbursed {formatInrCompact(paid)} of {formatInrCompact(pilot.budget_allocated)}</span>
                <span>
                  {milestones.filter((m) => m.status === "paid").length}/{milestones.length} tranches paid
                </span>
              </div>
              {kpis.length > 0 && (
                <div className="mt-3 space-y-2">
                  {kpis.map((k) => (
                    <KpiRow key={k.id} kpi={k} />
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {milestones
                  .filter((m) => m.status !== "paid" && m.status !== "approved")
                  .map((m) => (
                    <Button key={m.id} size="sm" variant="outline" onClick={() => setMilestoneOpen(m)}>
                      Submit M{m.seq} evidence
                    </Button>
                  ))}
              </div>
            </Card>
          );
        })
      )}

      {milestoneOpen && (
        <SubmitMilestoneDialog
          milestone={milestoneOpen}
          onClose={() => setMilestoneOpen(null)}
          onDone={() => {
            setMilestoneOpen(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function SubmitMilestoneDialog({
  milestone,
  onClose,
  onDone,
}: {
  milestone: Milestone;
  onClose: () => void;
  onDone: () => void;
}) {
  const [evidence, setEvidence] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit() {
    const names = evidence
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setBusy(true);
    await submitMilestone(milestone.id, names);
    setBusy(false);
    onDone();
  }
  return (
    <Dialog open title={`Submit evidence · M${milestone.seq}`} onClose={onClose} width="max-w-lg">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{milestone.title}</p>
        <Field label="Evidence files (comma separated)">
          <Textarea
            value={evidence}
            onChange={setEvidence}
            placeholder="delivery_report.pdf, kpi_snapshot.csv, site_photo.png"
          />
        </Field>
        <p className="text-xs text-slate-500">
          Tranche of {formatInrCompact(milestone.amount)} is released by the Platform Admin only after
          KPI verification.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit for approval"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------ Agreements ------------------------------ */

function AgreementsTab({ data, onChanged }: { data: StartupPortalData; onChanged: () => void }) {
  const [signingAgreement, setSigningAgreement] = React.useState<any | null>(null);

  if (data.myAgreements.length === 0) {
    return <EmptyState title="No agreements yet" hint="Agreements are generated once a pilot is created." />;
  }
  return (
    <div className="space-y-4">
      {data.myAgreements.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{a.reference_no}</p>
              <p className="text-xs text-slate-500">
                IP: {humanise(a.ip_ownership)} · Data: {humanise(a.data_classification)} · Retention{" "}
                {a.data_retention_months} mo · Residency {a.data_residency_in_india ? "India" : "abroad"}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <Chips
            items={[
              a.status === "sent_to_startup" || a.status === "draft" ? "Awaiting your e-signature" : undefined,
              a.status === "signed_by_startup" ? "Awaiting department execution" : undefined,
              a.status === "executed" ? "Executed" : undefined,
            ]}
          />
          {(a.status === "sent_to_startup" || a.status === "draft") && (
            <Button className="mt-3" size="sm" onClick={() => setSigningAgreement(a)}>
              ✍️ Review & E-Sign Agreement
            </Button>
          )}
        </Card>
      ))}

      {signingAgreement && (
        <ContractSigningModal
          agreement={signingAgreement}
          onClose={() => setSigningAgreement(null)}
          onSigned={() => {
            setSigningAgreement(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- helpers -------------------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}