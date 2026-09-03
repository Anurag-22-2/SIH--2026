/**
 * In-memory platform store.
 *
 * Seeded from `mock-data.ts` and mutated directly by UI actions, so the whole
 * product is demoable with no server, no database and no native modules.
 * `api.ts` is the async facade the components talk to.
 */

import {
  DEFAULT_EVALUATION_WEIGHTS,
  DEFAULT_USER_BY_ROLE,
  createSeedData,
} from "./mock-data";
import type {
  ActivityEntry,
  Challenge,
  Evaluation,
  EvaluationCriterionKey,
  EvaluationRecommendation,
  Kpi,
  KpiSnapshot,
  LegalTemplate,
  Milestone,
  MilestoneEvidence,
  Pilot,
  PilotAgreement,
  PilotMeeting,
  PlatformData,
  Proposal,
  ReadinessScorecard,
  Role,
  ScaleDecision,
  ScaleDecisionType,
  Sector,
  User,
} from "./types";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

let db: PlatformData = createSeedData();
let currentUserId: string = DEFAULT_USER_BY_ROLE.government;

/** Reset the store back to the pristine seed dataset. */
export function resetStore() {
  db = createSeedData();
}

export function getRawData(): PlatformData {
  return db;
}

export function setCurrentUserId(id: string) {
  if (db.users.some((u) => u.id === id)) currentUserId = id;
}

export function setCurrentRole(role: Role): User {
  const id = DEFAULT_USER_BY_ROLE[role];
  currentUserId = id;
  return getCurrentUser();
}

export function getCurrentUser(): User {
  return (
    db.users.find((u) => u.id === currentUserId) ??
    db.users.find((u) => u.role === "government")!
  );
}

export function listUsers(role?: Role): User[] {
  return db.users.filter((u) => (role ? u.role === role : true));
}

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function log(action: string, entityType: string, entityId: string, details?: string) {
  const user = getCurrentUser();
  const entry: ActivityEntry = {
    id: nextId("act"),
    user_id: user.id,
    user_name: user.full_name,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    created_at: nowIso(),
  };
  db.activity.unshift(entry);
}

/* ------------------------------------------------------------------ */
/* Scoring helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Weighted score on a 5-point scale. Only criteria that carry a score are
 * counted, and weights are renormalised so partially scored evaluations remain
 * comparable.
 */
export function computeWeightedScore(
  scores: Partial<Record<EvaluationCriterionKey, number>>,
  weightMap: Record<EvaluationCriterionKey, number> = DEFAULT_EVALUATION_WEIGHTS,
): number | undefined {
  const keys = (Object.keys(scores) as EvaluationCriterionKey[]).filter(
    (k) => typeof scores[k] === "number",
  );
  if (keys.length === 0) return undefined;
  const totalWeight = keys.reduce((sum, k) => sum + (weightMap[k] ?? 0), 0);
  if (totalWeight === 0) return undefined;
  const weighted = keys.reduce((sum, k) => sum + (scores[k] as number) * (weightMap[k] ?? 0), 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function recommendationFromScore(score: number): EvaluationRecommendation {
  if (score >= 4.2) return "strongly_accept";
  if (score >= 3.5) return "accept";
  if (score >= 2.8) return "neutral";
  if (score >= 2) return "reject";
  return "strongly_reject";
}

function weightsForProposal(proposalId: string): Record<EvaluationCriterionKey, number> {
  const proposal = db.proposals.find((p) => p.id === proposalId);
  const challenge = db.challenges.find((c) => c.id === proposal?.challenge_id);
  return challenge?.evaluation_weights ?? DEFAULT_EVALUATION_WEIGHTS;
}

/* ------------------------------------------------------------------ */
/* Enrichment (denormalised display fields + derived panel scores)      */
/* ------------------------------------------------------------------ */

export function enrichEvaluation(e: Evaluation): Evaluation {
  const expert = db.users.find((u) => u.id === e.expert_id);
  const proposal = db.proposals.find((p) => p.id === e.proposal_id);
  const challenge = db.challenges.find((c) => c.id === proposal?.challenge_id);
  const startup = db.users.find((u) => u.id === proposal?.startup_id);
  return {
    ...e,
    weighted_score: computeWeightedScore(e.scores, weightsForProposal(e.proposal_id)),
    expert_name: expert?.full_name,
    expert_org: expert?.organization,
    proposal_title: proposal?.title,
    challenge_title: challenge?.title,
    startup_org: startup?.organization,
  };
}

export function enrichProposal(p: Proposal): Proposal {
  const startup = db.users.find((u) => u.id === p.startup_id);
  const challenge = db.challenges.find((c) => c.id === p.challenge_id);
  const submitted = db.evaluations.filter(
    (e) => e.proposal_id === p.id && e.status === "submitted" && !e.conflict_of_interest,
  );

  const criterion_scores: Partial<Record<EvaluationCriterionKey, number>> = {};
  const keys = Object.keys(
    challenge?.evaluation_weights ?? DEFAULT_EVALUATION_WEIGHTS,
  ) as EvaluationCriterionKey[];
  for (const key of keys) {
    const values = submitted
      .map((e) => e.scores[key])
      .filter((v): v is number => typeof v === "number");
    if (values.length > 0) {
      criterion_scores[key] =
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    }
  }

  const weighted = computeWeightedScore(
    criterion_scores,
    challenge?.evaluation_weights ?? DEFAULT_EVALUATION_WEIGHTS,
  );

  return {
    ...p,
    startup_name: startup?.full_name,
    startup_org: startup?.organization,
    startup_district: startup?.district,
    startup_team_size: startup?.team_size,
    startup_udyam_number: startup?.udyam_number,
    challenge_title: challenge?.title,
    criterion_scores,
    weighted_score: weighted,
    evaluations_count: submitted.length,
    panel_recommendation: weighted != null ? recommendationFromScore(weighted) : undefined,
  };
}

export function enrichPilot(p: Pilot): Pilot {
  const challenge = db.challenges.find((c) => c.id === p.challenge_id);
  const startup = db.users.find((u) => u.id === p.startup_id);
  return {
    ...p,
    challenge_title: challenge?.title,
    sector: challenge?.sector,
    district: challenge?.district,
    startup_name: startup?.full_name,
    startup_org: startup?.organization,
  };
}

export function enrichSnapshot(s: KpiSnapshot): KpiSnapshot {
  const kpi = db.kpis.find((k) => k.id === s.kpi_id);
  return { ...s, kpi_name: kpi?.name };
}

/* ------------------------------------------------------------------ */
/* KPI achievement                                                     */
/* ------------------------------------------------------------------ */

/** Latest snapshot for a KPI. */
export function latestSnapshot(kpiId: string): KpiSnapshot | undefined {
  return db.snapshots
    .filter((s) => s.kpi_id === kpiId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

/**
 * Achievement against target as a percentage, direction aware and capped at
 * 100 so a single over-performing metric cannot mask a failing one.
 */
export function kpiAchievement(kpi: Kpi): number | undefined {
  const latest = latestSnapshot(kpi.id);
  if (!latest || typeof latest.reported_value !== "number") return undefined;
  if (typeof kpi.target_value !== "number") return undefined;

  const baseline = kpi.baseline_value ?? 0;
  const current = latest.reported_value;
  const target = kpi.target_value;

  if (kpi.direction === "increase") {
    if (target <= baseline) return current >= target ? 100 : 0;
    return clampPct(((current - baseline) / (target - baseline)) * 100);
  }
  // decrease: closing the gap from baseline down to target
  if (baseline <= target) return current <= target ? 100 : 0;
  return clampPct(((baseline - current) / (baseline - target)) * 100);
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Average KPI achievement across a pilot, weighted by KPI weight. */
export function pilotKpiAchievement(pilotId: string): number | undefined {
  const list = db.kpis.filter((k) => k.pilot_id === pilotId);
  const scored = list
    .map((k) => ({ weight: k.weight || 1, value: kpiAchievement(k) }))
    .filter((x): x is { weight: number; value: number } => typeof x.value === "number");
  if (scored.length === 0) return undefined;
  const totalWeight = scored.reduce((a, s) => a + s.weight, 0);
  return Math.round(scored.reduce((a, s) => a + s.value * s.weight, 0) / totalWeight);
}

/* ------------------------------------------------------------------ */
/* Readiness scorecard (drives the scale-up recommendation)            */
/* ------------------------------------------------------------------ */

export function readinessScorecard(pilotId: string): ReadinessScorecard {
  const pilot = db.pilots.find((p) => p.id === pilotId)!;
  const pilotMilestones = db.milestones.filter((m) => m.pilot_id === pilotId);
  const proposal = db.proposals.find((p) => p.id === pilot?.proposal_id);

  const kpi_achievement = pilotKpiAchievement(pilotId) ?? 0;

  const completed = pilotMilestones.filter(
    (m) => m.status === "approved" || m.status === "paid",
  ).length;
  const milestone_completion =
    pilotMilestones.length > 0 ? Math.round((completed / pilotMilestones.length) * 100) : 0;

  const panelScore = proposal ? enrichProposal(proposal).weighted_score : undefined;
  const evaluation_score = panelScore != null ? Math.round((panelScore / 5) * 100) : 0;

  // Spending at or under the allocation scores 100; overspend is penalised.
  const budget_adherence =
    pilot.budget_allocated > 0
      ? clampPct(
          pilot.budget_spent <= pilot.budget_allocated
            ? 100
            : 100 - ((pilot.budget_spent - pilot.budget_allocated) / pilot.budget_allocated) * 100,
        )
      : 100;

  const composite = Math.round(
    kpi_achievement * 0.4 +
      milestone_completion * 0.25 +
      evaluation_score * 0.2 +
      budget_adherence * 0.15,
  );

  const rationale: string[] = [];
  rationale.push(`Weighted KPI achievement at ${kpi_achievement}% of targets.`);
  rationale.push(`${completed} of ${pilotMilestones.length} milestones approved or paid.`);
  if (panelScore != null) {
    rationale.push(`Expert panel weighted score of ${panelScore.toFixed(2)} / 5.`);
  } else {
    rationale.push("No submitted expert evaluations on record.");
  }
  rationale.push(
    pilot.budget_spent <= pilot.budget_allocated
      ? "Expenditure within sanctioned allocation."
      : "Expenditure has exceeded the sanctioned allocation.",
  );

  let recommendation: ScaleDecisionType;
  if (pilot.status !== "completed") {
    recommendation = "iterate";
    rationale.push("Pilot is not yet closed; decision should wait for outcome validation.");
  } else if (composite >= 80 && kpi_achievement >= 85) {
    recommendation = "gem_procurement";
    rationale.push("Outcomes validated at scale-ready level — eligible for GeM procurement.");
  } else if (composite >= 65) {
    recommendation = "scale_pilot";
    rationale.push("Promising but partial outcomes — extend the pilot to more districts first.");
  } else if (composite >= 45) {
    recommendation = "iterate";
    rationale.push("Material gaps against targets — iterate the solution before scaling.");
  } else {
    recommendation = "exit";
    rationale.push("Outcomes fall short of the threshold for further public investment.");
  }

  return {
    pilot_id: pilotId,
    kpi_achievement,
    milestone_completion,
    evaluation_score,
    budget_adherence,
    composite,
    recommendation,
    rationale,
  };
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function selectChallenges(): Challenge[] {
  return [...db.challenges].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function selectProposals(): Proposal[] {
  return db.proposals
    .map(enrichProposal)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function selectPilots(): Pilot[] {
  return db.pilots.map(enrichPilot).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function selectMilestones(): Milestone[] {
  return [...db.milestones].sort(
    (a, b) => a.pilot_id.localeCompare(b.pilot_id) || a.seq - b.seq,
  );
}

export function selectEvaluations(): Evaluation[] {
  return db.evaluations
    .map(enrichEvaluation)
    .sort((a, b) => (b.submitted_at ?? b.created_at).localeCompare(a.submitted_at ?? a.created_at));
}

export function selectKpis(): Kpi[] {
  return [...db.kpis];
}

export function selectSnapshots(): KpiSnapshot[] {
  return db.snapshots
    .map(enrichSnapshot)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function selectLegalTemplates(): LegalTemplate[] {
  return [...db.legalTemplates];
}

export function selectAgreements(): PilotAgreement[] {
  return [...db.agreements];
}

export function selectScaleDecisions(): ScaleDecision[] {
  return db.scaleDecisions
    .map((d) => {
      const pilot = db.pilots.find((p) => p.id === d.pilot_id);
      const challenge = db.challenges.find((c) => c.id === d.challenge_id);
      const startup = db.users.find((u) => u.id === pilot?.startup_id);
      return {
        ...d,
        pilot_title: challenge?.title,
        startup_org: startup?.organization,
      };
    })
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at));
}

export function selectActivity(limit = 40): ActivityEntry[] {
  return db.activity
    .map((a) => ({
      ...a,
      user_name: a.user_name ?? db.users.find((u) => u.id === a.user_id)?.full_name,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Mutations — challenges & proposals                                  */
/* ------------------------------------------------------------------ */

export type NewChallengeInput = Omit<
  Challenge,
  "id" | "challenge_code" | "created_by" | "created_at" | "updated_at" | "budget_range"
> & { challenge_code?: string; budget_range?: string };

export function createChallenge(input: NewChallengeInput): Challenge {
  const user = getCurrentUser();
  const sectorCode =
    input.sector === "PWD" ? "PWD" : input.sector === "Urban Waste" ? "UWM" : "WQM";
  const year = new Date().getFullYear();
  const seq = String(
    db.challenges.filter((c) => c.challenge_code.includes(`/${year}/`)).length + 1,
  ).padStart(3, "0");

  const challenge: Challenge = {
    ...input,
    id: nextId("chl"),
    challenge_code: input.challenge_code || `MSINS/${sectorCode}/${year}/${seq}`,
    budget_range:
      input.budget_range || `${formatShortInr(input.budget_min)} – ${formatShortInr(input.budget_max)}`,
    created_by: user.id,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.challenges.unshift(challenge);
  log("published_challenge", "challenge", challenge.id, `${challenge.title} (${challenge.budget_range})`);
  return challenge;
}

/** Compact INR label used for generated budget ranges. */
function formatShortInr(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2).replace(/\.00$/, "")} Cr`;
  return `₹${Math.round(value / 100_000)} L`;
}

export function updateChallenge(id: string, patch: Partial<Challenge>): Challenge | null {
  const idx = db.challenges.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.challenges[idx] = { ...db.challenges[idx], ...patch, updated_at: nowIso() };
  log("updated_challenge", "challenge", id, patch.status ? `status → ${patch.status}` : undefined);
  return db.challenges[idx];
}

export type NewProposalInput = {
  challenge_id: string;
  title: string;
  description: string;
  solution_approach: string;
  timeline_weeks: number;
  budget_estimate: number;
  team_description: string;
  past_projects?: string;
  trl_level: number;
  accepted_data_ip_clauses: boolean;
  proposed_milestones: Proposal["proposed_milestones"];
  submission_notes?: string;
};

export function createProposal(input: NewProposalInput): Proposal {
  const user = getCurrentUser();
  const proposal: Proposal = {
    ...input,
    id: nextId("prp"),
    startup_id: user.id,
    dpiit_number: user.dpiit_number ?? "",
    dpiit_verified: Boolean(user.dpiit_verified),
    cin: user.cin,
    gstin: user.gstin,
    annual_turnover: user.annual_turnover,
    annual_profit_loss: user.annual_profit_loss,
    profit_loss_period: user.profit_loss_period,
    financial_doc_url: user.financial_doc_url,
    status: "submitted",
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.proposals.unshift(proposal);
  const expertIds = db.users
    .filter((candidate) => candidate.role === "expert")
    .map((candidate) => candidate.id)
    .slice(0, 3);
  if (expertIds.length > 0) {
    assignExperts(proposal.id, expertIds);
  }
  log(
    "submitted_proposal",
    "proposal",
    proposal.id,
    `${proposal.title} (₹${proposal.budget_estimate.toLocaleString("en-IN")})`,
  );
  return enrichProposal(proposal);
}

export function setProposalStatus(id: string, status: Proposal["status"]): Proposal | null {
  const idx = db.proposals.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.proposals[idx] = { ...db.proposals[idx], status, updated_at: nowIso() };
  const enriched = enrichProposal(db.proposals[idx]);
  log(
    status === "shortlisted" ? "shortlisted_proposal" : "updated_proposal_status",
    "proposal",
    id,
    `status → ${status}${
      enriched.weighted_score != null ? ` (panel ${enriched.weighted_score.toFixed(2)} / 5)` : ""
    }`,
  );
  return enriched;
}

/* ------------------------------------------------------------------ */
/* Mutations — expert panel assignment & evaluation                     */
/* ------------------------------------------------------------------ */

export function assignExperts(
  proposalId: string,
  expertIds: string[],
  dueDate?: string,
): Evaluation[] {
  const created: Evaluation[] = [];
  for (const expertId of expertIds) {
    const existing = db.evaluations.find(
      (e) => e.proposal_id === proposalId && e.expert_id === expertId,
    );
    if (existing) continue;
    const evaluation: Evaluation = {
      id: nextId("evl"),
      proposal_id: proposalId,
      expert_id: expertId,
      scores: {},
      conflict_of_interest: false,
      status: "assigned",
      due_date: dueDate,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.evaluations.push(evaluation);
    created.push(enrichEvaluation(evaluation));
  }
  if (created.length > 0) {
    const proposal = db.proposals.find((p) => p.id === proposalId);
    log(
      "assigned_experts",
      "proposal",
      proposalId,
      `${created.length} evaluator(s) assigned to ${proposal?.title ?? proposalId}`,
    );
    const idx = db.proposals.findIndex((p) => p.id === proposalId);
    if (idx > -1 && db.proposals[idx].status === "submitted") {
      db.proposals[idx] = { ...db.proposals[idx], status: "under_review", updated_at: nowIso() };
    }
  }
  return created;
}

export type EvaluationSubmission = {
  scores: Partial<Record<EvaluationCriterionKey, number>>;
  criterion_notes?: Partial<Record<EvaluationCriterionKey, string>>;
  overall_comment?: string;
  strengths?: string;
  risks?: string;
  recommendation?: EvaluationRecommendation;
  confidence_level?: number;
};

/** Save progress without submitting. */
export function saveEvaluationDraft(id: string, patch: EvaluationSubmission): Evaluation | null {
  const idx = db.evaluations.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  db.evaluations[idx] = {
    ...db.evaluations[idx],
    ...patch,
    status: db.evaluations[idx].status === "submitted" ? "submitted" : "in_progress",
    updated_at: nowIso(),
  };
  log("saved_evaluation_draft", "evaluation", id);
  return enrichEvaluation(db.evaluations[idx]);
}

export function submitEvaluation(id: string, patch: EvaluationSubmission): Evaluation | null {
  const idx = db.evaluations.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const weightMap = weightsForProposal(db.evaluations[idx].proposal_id);
  const weighted = computeWeightedScore(patch.scores, weightMap);

  db.evaluations[idx] = {
    ...db.evaluations[idx],
    ...patch,
    recommendation: patch.recommendation ?? (weighted != null ? recommendationFromScore(weighted) : undefined),
    status: "submitted",
    submitted_at: nowIso(),
    updated_at: nowIso(),
  };

  const enriched = enrichEvaluation(db.evaluations[idx]);
  log(
    "submitted_evaluation",
    "evaluation",
    id,
    `${enriched.proposal_title ?? ""} — ${enriched.weighted_score?.toFixed(2) ?? "—"} / 5 (${
      enriched.recommendation ?? "no recommendation"
    })`,
  );
  return enriched;
}

export function declareConflict(id: string, note: string): Evaluation | null {
  const idx = db.evaluations.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  db.evaluations[idx] = {
    ...db.evaluations[idx],
    conflict_of_interest: true,
    conflict_note: note,
    scores: {},
    status: "assigned",
    updated_at: nowIso(),
  };
  log("declared_conflict", "evaluation", id, note);
  return enrichEvaluation(db.evaluations[idx]);
}

/* ------------------------------------------------------------------ */
/* Mutations — pilots & milestones                                     */
/* ------------------------------------------------------------------ */

export type NewPilotInput = {
  proposal_id: string;
  work_order_no?: string;
  budget_allocated: number;
  start_date: string;
  end_date: string;
  nodal_officer?: string;
  summary?: string;
};

/**
 * Converts a shortlisted proposal into a pilot, generating the milestone
 * payment schedule from the milestone plan the startup proposed.
 */
export function createPilotFromProposal(input: NewPilotInput): Pilot | null {
  const proposal = db.proposals.find((p) => p.id === input.proposal_id);
  if (!proposal) return null;
  const challenge = db.challenges.find((c) => c.id === proposal.challenge_id);

  const pilot: Pilot = {
    id: nextId("plt"),
    work_order_no: input.work_order_no || `MSINS/WO/${new Date().getFullYear()}/${nextId("").slice(1, 5)}`,
    proposal_id: proposal.id,
    challenge_id: proposal.challenge_id,
    startup_id: proposal.startup_id,
    status: "planned",
    start_date: input.start_date,
    end_date: input.end_date,
    budget_allocated: input.budget_allocated,
    budget_spent: 0,
    progress_percentage: 0,
    summary: input.summary,
    nodal_officer: input.nodal_officer,
    deployment_sites: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.pilots.unshift(pilot);

  const startDate = new Date(input.start_date);
  proposal.proposed_milestones.forEach((pm, i) => {
    const due = new Date(startDate);
    due.setDate(due.getDate() + pm.week * 7);
    const milestone: Milestone = {
      id: nextId("ms"),
      pilot_id: pilot.id,
      seq: i + 1,
      title: pm.title,
      description: pm.deliverable,
      deliverables: [pm.deliverable],
      due_date: due.toISOString(),
      amount: Math.round((input.budget_allocated * pm.payment_percentage) / 100),
      payment_percentage: pm.payment_percentage,
      status: i === 0 ? "in_progress" : "pending",
      evidence: [],
      kpi_links: [],
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.milestones.push(milestone);
  });

  // Move the proposal and challenge into the piloting stage.
  const pIdx = db.proposals.findIndex((p) => p.id === proposal.id);
  db.proposals[pIdx] = { ...db.proposals[pIdx], status: "piloting", updated_at: nowIso() };
  if (challenge) updateChallenge(challenge.id, { status: "piloting" });

  log(
    "created_pilot",
    "pilot",
    pilot.id,
    `${pilot.work_order_no} issued for ${proposal.title} (₹${input.budget_allocated.toLocaleString("en-IN")})`,
  );
  return enrichPilot(pilot);
}

export function updatePilot(id: string, patch: Partial<Pilot>): Pilot | null {
  const idx = db.pilots.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.pilots[idx] = { ...db.pilots[idx], ...patch, updated_at: nowIso() };
  log(
    patch.status ? "updated_pilot_status" : "updated_pilot",
    "pilot",
    id,
    patch.status ? `status → ${patch.status}` : `progress → ${patch.progress_percentage ?? "—"}%`,
  );
  return enrichPilot(db.pilots[idx]);
}

/** Startup action: claim a milestone tranche with evidence. */
export function submitMilestone(id: string, evidenceNames: string[]): Milestone | null {
  const idx = db.milestones.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const evidence: MilestoneEvidence[] = evidenceNames
    .filter((n) => n.trim().length > 0)
    .map((name) => ({
      name: name.trim(),
      kind: name.toLowerCase().includes("invoice")
        ? "invoice"
        : name.toLowerCase().includes("certificate")
          ? "certificate"
          : name.toLowerCase().match(/\.(csv|json|xlsx)$/)
            ? "dataset"
            : name.toLowerCase().match(/\.(jpg|jpeg|png|zip)$/)
              ? "photo"
              : "report",
      uploaded_at: nowIso(),
    }));

  db.milestones[idx] = {
    ...db.milestones[idx],
    status: "submitted",
    evidence: [...db.milestones[idx].evidence, ...evidence],
    submitted_at: nowIso(),
    reviewer_notes: undefined,
    updated_at: nowIso(),
  };
  const m = db.milestones[idx];
  log(
    "submitted_milestone",
    "milestone",
    id,
    `${m.title} (₹${m.amount.toLocaleString("en-IN")}) submitted for approval`,
  );
  return m;
}

/* ------------------------------------------------------------------ */
/* Mutations — admin milestone approval & payment release               */
/* ------------------------------------------------------------------ */

export function reviewMilestone(
  id: string,
  decision: "approved" | "rejected" | "under_review",
  notes: string,
): Milestone | null {
  const idx = db.milestones.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const user = getCurrentUser();
  db.milestones[idx] = {
    ...db.milestones[idx],
    status: decision,
    reviewed_at: nowIso(),
    reviewed_by: user.id,
    reviewer_notes: notes,
    updated_at: nowIso(),
  };
  const m = db.milestones[idx];
  log(
    decision === "approved"
      ? "approved_milestone"
      : decision === "rejected"
        ? "rejected_milestone"
        : "held_milestone",
    "milestone",
    id,
    `${m.title} — ${decision}`,
  );
  return m;
}

/** Release an approved tranche and record the payment reference. */
export function releaseMilestonePayment(
  id: string,
  mode: Milestone["payment_mode"] = "PFMS",
): Milestone | null {
  const idx = db.milestones.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  if (db.milestones[idx].status !== "approved") return db.milestones[idx];

  const utr = `UTR${new Date().getFullYear()}${Math.floor(Math.random() * 90_000_000 + 10_000_000)}`;
  db.milestones[idx] = {
    ...db.milestones[idx],
    status: "paid",
    paid_at: nowIso(),
    payment_utr: utr,
    payment_mode: mode,
    updated_at: nowIso(),
  };
  const m = db.milestones[idx];

  // Roll the disbursement into pilot expenditure and progress.
  const pIdx = db.pilots.findIndex((p) => p.id === m.pilot_id);
  if (pIdx > -1) {
    const pilotMilestones = db.milestones.filter((x) => x.pilot_id === m.pilot_id);
    const paidPct = pilotMilestones
      .filter((x) => x.status === "paid")
      .reduce((a, x) => a + x.payment_percentage, 0);
    db.pilots[pIdx] = {
      ...db.pilots[pIdx],
      budget_spent: db.pilots[pIdx].budget_spent + m.amount,
      progress_percentage: Math.max(db.pilots[pIdx].progress_percentage, Math.min(100, paidPct)),
      status: db.pilots[pIdx].status === "planned" ? "active" : db.pilots[pIdx].status,
      updated_at: nowIso(),
    };
  }

  log(
    "released_payment",
    "milestone",
    id,
    `₹${m.amount.toLocaleString("en-IN")} released via ${mode} (${utr})`,
  );
  return m;
}

/* ------------------------------------------------------------------ */
/* Mutations — KPIs                                                    */
/* ------------------------------------------------------------------ */

export function createKpi(input: Omit<Kpi, "id">): Kpi {
  const kpi: Kpi = { ...input, id: nextId("kpi") };
  db.kpis.push(kpi);
  log("created_kpi", "kpi", kpi.id, kpi.name);
  return kpi;
}

export function recordKpiSnapshot(input: {
  kpi_id: string;
  pilot_id: string;
  reported_value?: number;
  reported_text?: string;
  notes?: string;
  period?: string;
}): KpiSnapshot {
  const user = getCurrentUser();
  const snapshot: KpiSnapshot = {
    ...input,
    id: nextId("snp"),
    reported_by: user.id,
    verified: user.role === "government" || user.role === "admin",
    verified_by: user.role === "government" || user.role === "admin" ? user.id : undefined,
    created_at: nowIso(),
  };
  db.snapshots.unshift(snapshot);
  const kpi = db.kpis.find((k) => k.id === input.kpi_id);
  log(
    "recorded_kpi_snapshot",
    "kpi",
    input.kpi_id,
    `${kpi?.name ?? input.kpi_id} = ${input.reported_value ?? input.reported_text ?? "—"}${
      kpi?.unit ? ` ${kpi.unit}` : ""
    }`,
  );
  return enrichSnapshot(snapshot);
}

export function verifySnapshot(id: string): KpiSnapshot | null {
  const idx = db.snapshots.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const user = getCurrentUser();
  db.snapshots[idx] = { ...db.snapshots[idx], verified: true, verified_by: user.id };
  log("verified_kpi_snapshot", "kpi_snapshot", id);
  return enrichSnapshot(db.snapshots[idx]);
}

/* ------------------------------------------------------------------ */
/* Mutations — legal templates & agreements                            */
/* ------------------------------------------------------------------ */

export function generateAgreement(input: {
  pilot_id: string;
  template_ids: string[];
  ip_ownership: PilotAgreement["ip_ownership"];
  data_classification: PilotAgreement["data_classification"];
  data_retention_months: number;
  data_residency_in_india: boolean;
  notes?: string;
}): PilotAgreement {
  const year = new Date().getFullYear();
  const seq = String(db.agreements.length + 1).padStart(4, "0");
  const agreement: PilotAgreement = {
    ...input,
    id: nextId("agr"),
    reference_no: `MSINS/AGR/${year}/${seq}`,
    status: "draft",
    generated_at: nowIso(),
  };
  db.agreements.unshift(agreement);
  log("generated_agreement", "agreement", agreement.id, `${agreement.reference_no} drafted`);
  return agreement;
}

export function updateAgreementStatus(
  id: string,
  status: PilotAgreement["status"],
): PilotAgreement | null {
  const idx = db.agreements.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const user = getCurrentUser();
  const patch: Partial<PilotAgreement> = { status };
  if (status === "sent_to_startup") patch.sent_at = nowIso();
  if (status === "signed_by_startup") patch.startup_signed_at = nowIso();
  if (status === "executed") {
    patch.executed_at = nowIso();
    patch.executed_by = user.id;
  }
  db.agreements[idx] = { ...db.agreements[idx], ...patch };
  log(
    status === "executed" ? "executed_agreement" : "updated_agreement",
    "agreement",
    id,
    `${db.agreements[idx].reference_no} → ${status}`,
  );
  return db.agreements[idx];
}

export function upsertLegalTemplate(template: LegalTemplate): LegalTemplate {
  const idx = db.legalTemplates.findIndex((t) => t.id === template.id);
  if (idx === -1) db.legalTemplates.push(template);
  else db.legalTemplates[idx] = template;
  log("updated_legal_template", "legal_template", template.id, `${template.code} v${template.version}`);
  return template;
}

/* ------------------------------------------------------------------ */
/* Mutations — procurement & scale-up                                  */
/* ------------------------------------------------------------------ */

export function createScaleDecision(input: {
  pilot_id: string;
  decision: ScaleDecisionType;
  reasoning: string;
  next_steps: string;
  budget_allocated: number;
  timeline_months: number;
  districts: string[];
  units: string;
  population_covered: number;
  gem_category: string;
  gem_category_code: string;
  gem_mode?: ScaleDecision["gem"]["mode"];
  startup_runway_exemption: boolean;
}): ScaleDecision | null {
  const pilot = db.pilots.find((p) => p.id === input.pilot_id);
  if (!pilot) return null;
  const user = getCurrentUser();

  const decision: ScaleDecision = {
    id: nextId("scd"),
    pilot_id: pilot.id,
    proposal_id: pilot.proposal_id,
    challenge_id: pilot.challenge_id,
    decision: input.decision,
    reasoning: input.reasoning,
    next_steps: input.next_steps,
    budget_allocated: input.budget_allocated,
    timeline_months: input.timeline_months,
    scale_scope: {
      districts: input.districts,
      units: input.units,
      population_covered: input.population_covered,
    },
    gem: {
      category: input.gem_category,
      category_code: input.gem_category_code,
      stage: input.decision === "gem_procurement" ? "category_mapped" : "not_started",
      mode: input.gem_mode,
      contract_value: input.decision === "gem_procurement" ? input.budget_allocated : undefined,
      startup_runway_exemption: input.startup_runway_exemption,
    },
    approvals: [
      {
        stage: "Outcome validation",
        authority: pilot.nodal_officer ?? "Sponsoring department nodal officer",
        status: "approved",
        acted_on: nowIso(),
        remark: "Outcome targets certified against verified KPI snapshots on the platform.",
      },
      {
        stage: "Scale-Up Committee recommendation",
        authority: "Chief Executive Officer, MSINS",
        status: "approved",
        acted_on: nowIso(),
        remark: `Recorded decision: ${input.decision.replace(/_/g, " ")}.`,
      },
      { stage: "Expenditure sanction", authority: "Finance Department (Expenditure Wing)", status: "pending" },
      { stage: "Administrative approval", authority: "Principal Secretary, sponsoring department", status: "pending" },
      { stage: "GeM contract award", authority: "GeM Buyer — departmental procurement cell", status: "pending" },
    ],
    decided_by: user.id,
    decided_at: nowIso(),
  };

  db.scaleDecisions.unshift(decision);

  // Reflect the decision on the pilot and proposal.
  if (input.decision === "gem_procurement" || input.decision === "scale_pilot") {
    updatePilot(pilot.id, { status: "scaled" });
    const pIdx = db.proposals.findIndex((p) => p.id === pilot.proposal_id);
    if (pIdx > -1) db.proposals[pIdx] = { ...db.proposals[pIdx], status: "scaled", updated_at: nowIso() };
  }

  log(
    "recorded_scale_decision",
    "scale_decision",
    decision.id,
    `${input.decision.replace(/_/g, " ")} — ₹${input.budget_allocated.toLocaleString("en-IN")}`,
  );
  return decision;
}

export function advanceGemStage(
  id: string,
  patch: Partial<ScaleDecision["gem"]>,
): ScaleDecision | null {
  const idx = db.scaleDecisions.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  db.scaleDecisions[idx] = {
    ...db.scaleDecisions[idx],
    gem: { ...db.scaleDecisions[idx].gem, ...patch },
  };
  log("advanced_gem_stage", "scale_decision", id, `GeM stage → ${patch.stage ?? "updated"}`);
  return db.scaleDecisions[idx];
}

export function actOnApproval(
  decisionId: string,
  stage: string,
  status: "approved" | "rejected",
  remark: string,
): ScaleDecision | null {
  const idx = db.scaleDecisions.findIndex((d) => d.id === decisionId);
  if (idx === -1) return null;
  db.scaleDecisions[idx] = {
    ...db.scaleDecisions[idx],
    approvals: db.scaleDecisions[idx].approvals.map((a) =>
      a.stage === stage ? { ...a, status, remark, acted_on: nowIso() } : a,
    ),
  };
  log("acted_on_approval", "scale_decision", decisionId, `${stage} → ${status}`);
  return db.scaleDecisions[idx];
}

/* ------------------------------------------------------------------ */
/* Mutations — user administration                                     */
/* ------------------------------------------------------------------ */

export function setDpiitVerification(userId: string, verified: boolean): User | null {
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], dpiit_verified: verified };

  // Keep submitted proposals in step with the verification decision.
  db.proposals = db.proposals.map((p) =>
    p.startup_id === userId ? { ...p, dpiit_verified: verified } : p,
  );

  log(
    verified ? "verified_dpiit" : "revoked_dpiit",
    "user",
    userId,
    `${db.users[idx].organization ?? db.users[idx].full_name} — DPIIT ${
      verified ? "verified" : "verification withdrawn"
    }`,
  );
  return db.users[idx];
}

export function updateUser(userId: string, patch: Partial<User>): User | null {
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  log("updated_user", "user", userId);
  return db.users[idx];
}

export type StartupRegistrationInput = {
  email: string;
  full_name: string;
  organization: string;
  phone?: string;
  designation?: string;
  department?: string;
  district?: string;
  sectors?: Sector;
  dpiit_number?: string;
  dpiit_valid_till?: string;
  dpiit_verified?: boolean;
  cin?: string;
  gstin?: string;
  incorporation_year?: number;
  team_size?: number;
  udyam_number?: string;
  msins_programme?: string;
  profit_loss_period?: string;
  annual_turnover?: number;
  annual_profit_loss?: number;
  financial_doc_url?: string;
};

/** Insert a newly registered startup user. DPIIT is seeded unverified pending admin review. */
export function registerStartup(input: StartupRegistrationInput): User {
  const user: User = {
    id: nextId("usr-str"),
    email: input.email,
    full_name: input.full_name,
    role: "startup",
    organization: input.organization,
    designation: input.designation ?? "Founder & CEO",
    department: input.department,
    district: input.district,
    phone: input.phone,
    sectors: typeof input.sectors === "string" ? [input.sectors as Sector] : input.sectors,
    dpiit_number: input.dpiit_number,
    dpiit_verified: input.dpiit_verified ?? false,
    dpiit_valid_till: input.dpiit_valid_till ?? "",
    cin: input.cin,
    gstin: input.gstin,
    incorporation_year: input.incorporation_year,
    team_size: input.team_size,
    udyam_number: input.udyam_number,
    msins_programme: input.msins_programme ?? "MSINS Startup Registry",
    profit_loss_period: input.profit_loss_period,
    annual_turnover: input.annual_turnover,
    annual_profit_loss: input.annual_profit_loss,
    financial_doc_url: input.financial_doc_url,
    bio: `Registered startup · ${input.organization ?? input.full_name}`,
  };
  db.users.unshift(user);
  log(
    "registered_startup",
    "user",
    user.id,
    `${user.organization ?? user.full_name} — DPIIT ${user.dpiit_number ?? "not provided"}, registered with financial details`,
  );
  setCurrentUserId(user.id);
  return user;
}

export function selectMeetings(pilotId?: string): PilotMeeting[] {
  if (!db.meetings) db.meetings = [];
  if (pilotId) return db.meetings.filter((m) => m.pilot_id === pilotId);
  return [...db.meetings];
}

export function createMeeting(input: Omit<PilotMeeting, "id" | "created_at">): PilotMeeting {
  if (!db.meetings) db.meetings = [];
  const meeting: PilotMeeting = {
    ...input,
    id: nextId("mt"),
    created_at: nowIso(),
  };
  db.meetings.unshift(meeting);
  log("scheduled_meeting", "meeting", meeting.id, `Scheduled: ${meeting.title}`);
  return meeting;
}

export function updateMeeting(id: string, patch: Partial<PilotMeeting>): PilotMeeting | null {
  if (!db.meetings) db.meetings = [];
  const idx = db.meetings.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.meetings[idx] = { ...db.meetings[idx], ...patch };
  log("updated_meeting", "meeting", id);
  return db.meetings[idx];
}
