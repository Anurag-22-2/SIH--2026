/**
 * API facade for GovPilot OS.
 *
 * Every dashboard talks to these functions. They first attempt a live fetch()
 * against the Express backend configured by NEXT_PUBLIC_API_URL. Requests
 * without a session use the local store for the demo experience; authenticated
 * failures are surfaced to the caller instead of being presented as success.
 */

import * as store from "./store";
import type { StartupRegistrationInput } from "./store";
import { DEFAULT_EVALUATION_WEIGHTS } from "./mock-data";
import type {
  AdminPortalData,
  Challenge,
  DashboardData,
  Evaluation,
  ExpertPortalData,
  Kpi,
  KpiSnapshot,
  Milestone,
  Pilot,
  PilotAgreement,
  PilotMeeting,
  Proposal,
  ProposedMilestone,
  ReadinessScorecard,
  Role,
  ScaleDecision,
  Sector,
  StartupPortalData,
  User,
} from "./types";

/* ------------------------------------------------------------------ */
/* Backend config                                                      */
/* ------------------------------------------------------------------ */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("govpilot_token");
}

function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("govpilot_token", token);
  else localStorage.removeItem("govpilot_token");
}

export function hasAuthToken(): boolean {
  return Boolean(getToken());
}

export interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  organization?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function authSignIn(
  email: string,
  password: string,
  role: Role = "government",
): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.warn("API call to /auth/login failed:", err);
    throw new Error(
      "The authentication service is unavailable. Please try again later.",
    );
  }
  const body = (await res.json().catch(() => null)) as
    | AuthResponse
    | { error?: string }
    | null;
  if (!res.ok || !body || !("token" in body) || !("user" in body)) {
    throw new Error(
      (body && "error" in body && body.error) || `HTTP ${res.status}: Unable to sign in`,
    );
  }
  setToken(body.token);
  return body;
}

export async function authSignUp(input: SignUpInput): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => null)) as
      | AuthResponse
      | { error?: string }
      | null;
    if (!res.ok || !body || !("token" in body) || !("user" in body)) {
      throw new Error(
        (body && "error" in body && body.error) || `HTTP ${res.status}: Unable to sign up`,
      );
    }
    setToken(body.token);
    return body;
  } catch (err) {
    console.warn("API call to /auth/register failed:", err);
    throw err instanceof Error
      ? err
      : new Error("Unable to create the account. Please try again.");
  }
}

export function authSignOut(): void {
  setToken(null);
}

async function apiCall<T>(
  path: string,
  options: RequestInit = {},
  fallback: () => T | Promise<T>,
): Promise<T> {
  // The demo store is the intentional unauthenticated experience. Avoid
  // making requests that the API will reject before using the local store.
  if (!getToken()) return fallback();

  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        setToken(null);
      }
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    return undefined as T;
  } catch (err) {
    console.warn(`API call to ${path} failed:`, err);
    throw err instanceof Error
      ? err
      : new Error(`API request to ${path} failed.`);
  }
}

/* ------------------------------------------------------------------ */
/* Session                                                            */
/* ------------------------------------------------------------------ */

export async function fetchCurrentUser(): Promise<User> {
  if (!getToken()) return store.getCurrentUser() as User;
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers,
    });

    if (res.status === 401) {
      setToken(null);
      throw new Error("HTTP 401: Authentication required");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return (await res.json()) as User;
  } catch (err) {
    console.warn("API call to /auth/me failed:", err);
    throw err instanceof Error
      ? err
      : new Error("Unable to restore the authenticated session.");
  }
}

export async function switchRole(role: Role): Promise<User> {
  return apiCall(
    "/auth/switch-role",
    { method: "POST", body: JSON.stringify({ role }) },
    () => store.setCurrentRole(role) as User,
  );
}

export async function signInAs(userId: string): Promise<User> {
  return apiCall(
    "/auth/sign-in",
    { method: "POST", body: JSON.stringify({ userId }) },
    () => {
      store.setCurrentUserId(userId);
      return store.getCurrentUser() as User;
    },
  );
}

export async function fetchUsers(role?: Role): Promise<User[]> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiCall(`/users${qs}`, {}, () => store.listUsers(role) as User[]);
}

export async function fetchExperts(): Promise<User[]> {
  return apiCall("/users?role=expert", {}, () => store.listUsers("expert") as User[]);
}

export async function fetchStartups(): Promise<User[]> {
  return apiCall("/users?role=startup", {}, () => store.listUsers("startup") as User[]);
}

export async function resetDemoData(): Promise<void> {
  return apiCall("/admin/reset", { method: "POST" }, () => {
    store.resetStore();
    return undefined as void;
  });
}

export async function registerStartup(input: StartupRegistrationInput): Promise<User> {
  return apiCall(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        role: "startup",
        password: "password123",
      }),
    },
    () => store.registerStartup(input) as User,
  );
}

export async function fetchRisks(): Promise<any[]> {
  return apiCall('/risks', {}, async () => {
    // demo fallback: map recent activity entries to simple risk items
    const items = store.selectActivity(20).map((n: any, i: number) => ({
      id: `RK-DEMO-${i}`,
      title: n.action || n.details || `Activity ${i + 1}`,
      description: n.details || n.action || '',
      severity: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
      status: 'open',
      owner: n.user_id,
      created_at: n.created_at,
    }));
    return items;
  });
}

/* ------------------------------------------------------------------ */
/* Government officer dashboard                                        */
/* ------------------------------------------------------------------ */

export async function fetchDashboard(): Promise<DashboardData> {
  return apiCall(
    "/dashboard",
    {},
    async () => ({
      challenges: store.selectChallenges(),
      proposals: store.selectProposals(),
      pilots: store.selectPilots(),
      milestones: store.selectMilestones(),
      kpis: store.selectKpis(),
      snapshots: store.selectSnapshots(),
      evaluations: store.selectEvaluations(),
      scaleDecisions: store.selectScaleDecisions(),
      contracts: store.selectAgreements(),
      meetings: store.selectMeetings(),
      experts: store.listUsers("expert"),
    }),
  ).then((d) => ({
    challenges: d?.challenges ?? [],
    proposals: d?.proposals ?? [],
    pilots: d?.pilots ?? [],
    milestones: d?.milestones ?? [],
    kpis: d?.kpis ?? [],
    snapshots: d?.snapshots ?? [],
    evaluations: d?.evaluations ?? [],
    scaleDecisions: d?.scaleDecisions ?? [],
    contracts: d?.contracts ?? [],
    meetings: d?.meetings ?? [],
    experts: d?.experts ?? [],
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getGfrFastTrackStatus(proposal: Proposal): {
  eligible: boolean;
  max_pilot_budget_inr: number;
  clause: string;
  rationale: string;
} {
  const trl = Number(proposal.trl_level ?? 0);
  const budget = Number(proposal.budget_estimate ?? 0);
  const isEligible = Boolean(proposal.dpiit_verified) && trl >= 8 && trl <= 9 && budget <= 50_000_00;

  if (!isEligible) {
    return {
      eligible: false,
      max_pilot_budget_inr: 0,
      clause: "No GFR exemption trigger — DPIIT recognition, TRL 8–9 and ≤ ₹50 Lakh budget cap are required.",
      rationale: "Fast-track approval is only available for vetted, higher-TRL startups with a capped pilot value.",
    };
  }

  return {
    eligible: true,
    max_pilot_budget_inr: Math.min(budget, 50_000_00),
    clause: "GFR exemption approved — direct pilot sanction can proceed without a full tender cycle up to ₹50 lakh.",
    rationale: "DPIIT-recognised startup with TRL 8–9 qualifies for accelerated procurement under the fast-track clause.",
  };
}

export function getSuccessProbabilityScore(proposal: Proposal): number {
  const teamSize = Number(proposal.startup_team_size ?? 0);
  const turnover = Number(proposal.annual_turnover ?? 0);
  const pastProjects = (proposal.past_projects ?? "")
    .split(/[\n,;]+/)
    .filter(Boolean).length;

  let score = 16;
  if (proposal.dpiit_verified) score += 24;
  if (proposal.trl_level >= 8) score += 20;
  if (proposal.trl_level >= 9) score += 10;
  score += clamp(teamSize * 0.7, 0, 18);
  score += turnover >= 20_000_000 ? 18 : turnover >= 5_000_000 ? 12 : turnover > 0 ? 6 : 0;
  score += clamp(pastProjects * 5, 0, 12);
  if (["shortlisted", "piloting"].includes(proposal.status)) score += 8;

  return clamp(Math.round(score), 0, 100);
}

export function maskStartupIdentity(rawValue?: string, fallback = "startup"): string {
  const source = rawValue?.trim() || fallback;
  const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const numeric = String((hash % 90) + 10).padStart(2, "0");
  return `Startup ${numeric}`;
}

/** Lightweight challenge-creation payload for the officer console. */
export interface CreateChallengeInput {
  title: string;
  sector: Sector;
  department: string;
  district: string;
  problem_statement: string;
  outcome_metric: string;
  expected_impact: string;
  pilot_budget_min: number;
  pilot_budget_max: number;
  submission_deadline?: string;
  programme?: string;
  description?: string;
  beneficiaries?: string;
  dpiit_eligible?: boolean;
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string;
  contact_person?: string;
  contact_email?: string;
  min_trl?: number;
  maharashtra_presence_required?: boolean;
  duration_weeks?: number;
}

export async function createChallenge(input: CreateChallengeInput): Promise<Challenge> {
  return apiCall(
    "/challenges",
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description ?? input.problem_statement,
        problem_statement: input.problem_statement,
        desired_outcomes: input.expected_impact,
        success_criteria: input.outcome_metric,
        budget_range: `${input.pilot_budget_min} – ${input.pilot_budget_max}`,
        duration_weeks: input.duration_weeks ?? 26,
        status: "open",
        priority: input.priority ?? "high",
        department: input.department,
        contact_person: input.contact_person,
        tags: input.tags,
        min_expert_evaluations: 3,
      }),
    },
    async () => {
      const created = store.createChallenge({
        title: input.title,
        description: input.description ?? input.problem_statement,
        problem_statement: input.problem_statement,
        desired_outcomes: input.expected_impact,
        success_criteria: input.outcome_metric,
        sector: input.sector,
        department: input.department,
        district: input.district,
        budget_min: input.pilot_budget_min,
        budget_max: input.pilot_budget_max,
        duration_weeks: input.duration_weeks ?? 26,
        status: "open",
        priority: input.priority ?? "high",
        tags: input.tags,
        contact_person: input.contact_person,
        contact_email: input.contact_email,
        outcome_targets: [
          {
            id: `ot-${Math.random().toString(36).slice(2, 8)}`,
            statement: input.outcome_metric,
            baseline: "To be established at pilot kick-off",
            target: input.outcome_metric,
            measurement_method: "Verified KPI snapshots on the platform",
          },
        ],
        eligibility: {
          dpiit_required: input.dpiit_eligible ?? true,
          min_trl: input.min_trl ?? 4,
          maharashtra_presence_required: input.maharashtra_presence_required ?? true,
          conditions: [],
        },
        evaluation_weights: DEFAULT_EVALUATION_WEIGHTS,
        expert_panel: [],
        min_expert_evaluations: 3,
        submission_deadline: input.submission_deadline,
        msins_programme: input.programme ?? "MSINS Innovation Challenge",
      });
      return created;
    },
  );
}

export async function updateChallenge(
  id: string,
  patch: Partial<Challenge>,
): Promise<Challenge | null> {
  return apiCall(
    `/challenges/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
    () => store.updateChallenge(id, patch),
  );
}

export async function setProposalStatus(
  id: string,
  status: Proposal["status"],
): Promise<Proposal | null> {
  return apiCall(
    `/proposals/${encodeURIComponent(id)}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
    () => store.setProposalStatus(id, status),
  );
}

export async function assignExperts(
  proposalId: string,
  expertIds: string[],
  dueDate?: string,
): Promise<Evaluation[]> {
  return apiCall(
    `/evaluations/assign`,
    {
      method: "POST",
      body: JSON.stringify({ proposalId, expertIds, dueDate }),
    },
    () => store.assignExperts(proposalId, expertIds, dueDate),
  );
}

/** Alias used by the government console. */
export const assignExpertsToProposal = assignExperts;

/**
 * Promote a shortlisted proposal to a pilot, generating the milestone payment
 * schedule from the startup's proposed plan.
 */
export async function createPilotFromProposal(
  proposalId: string,
  opts?: { title?: string; duration_months?: number; nodal_officer?: string },
): Promise<Pilot | null> {
  return apiCall(
    "/pilots",
    {
      method: "POST",
      body: JSON.stringify({
        proposal_id: proposalId,
        duration_months: opts?.duration_months ?? 9,
        title: opts?.title,
        nodal_officer: opts?.nodal_officer,
      }),
    },
    async () => {
      const proposal = store.getRawData().proposals.find((p) => p.id === proposalId);
      if (!proposal) return null;
      const months = opts?.duration_months ?? 9;
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + months);
      return store.createPilotFromProposal({
        proposal_id: proposalId,
        budget_allocated: proposal.budget_estimate,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        nodal_officer: opts?.nodal_officer,
        summary: opts?.title,
      });
    },
  );
}

export async function updatePilotStatus(
  id: string,
  status: Pilot["status"],
): Promise<Pilot | null> {
  return apiCall(
    `/pilots/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
    () => store.updatePilot(id, { status }),
  );
}

export async function createKpi(input: Omit<Kpi, "id">): Promise<Kpi> {
  return apiCall(
    "/kpis",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    () => store.createKpi(input),
  );
}

export async function recordKpiSnapshot(input: {
  kpi_id: string;
  pilot_id: string;
  reported_value?: number;
  reported_text?: string;
  notes?: string;
  period?: string;
}): Promise<KpiSnapshot> {
  return apiCall(
    "/kpis/snapshots",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    () => store.recordKpiSnapshot(input),
  );
}

export async function verifySnapshot(id: string): Promise<KpiSnapshot | null> {
  return apiCall(
    `/kpis/snapshots/${encodeURIComponent(id)}/verify`,
    { method: "POST" },
    () => store.verifySnapshot(id),
  );
}

/* ------------------------------------------------------------------ */
/* Startup portal                                                      */
/* ------------------------------------------------------------------ */

export async function fetchStartupPortal(): Promise<StartupPortalData> {
  return apiCall(
    "/startup/portal",
    {},
    async () => {
      const me = store.getCurrentUser();
      const myProposals = store.selectProposals().filter((p) => p.startup_id === me.id);
      const myPilots = store.selectPilots().filter((p) => p.startup_id === me.id);
      const pilotIds = new Set(myPilots.map((p) => p.id));
      const proposalIds = new Set(myProposals.map((p) => p.id));

      return {
        profile: me,
        availableChallenges: store
          .selectChallenges()
          .filter((c) => c.status === "open" || c.status === "in_review"),
        myProposals,
        myPilots,
        myMilestones: store.selectMilestones().filter((m) => pilotIds.has(m.pilot_id)),
        myKpis: store.selectKpis().filter((k) => k.pilot_id && pilotIds.has(k.pilot_id)),
        mySnapshots: store.selectSnapshots().filter((s) => pilotIds.has(s.pilot_id)),
        myEvaluations: store
          .selectEvaluations()
          .filter((e) => proposalIds.has(e.proposal_id) && e.status === "submitted"),
        myAgreements: store.selectAgreements().filter((a) => pilotIds.has(a.pilot_id)),
        myMeetings: store.selectMeetings().filter((m) => pilotIds.has(m.pilot_id)),
        legalTemplates: store.selectLegalTemplates(),
      };
    },
  );
}

export interface CreateProposalInput {
  challenge_id: string;
  title: string;
  summary: string;
  solution_approach: string;
  budget_estimate: number;
  timeline_weeks: number;
  trl_level?: number;
  proposed_milestones?: ProposedMilestone[];
  submission_notes?: string;
}

export async function fetchProposals(): Promise<Proposal[]> {
  return apiCall(
    "/proposals",
    {},
    () => store.selectProposals() as Proposal[],
  );
}

export async function fetchChallenges(): Promise<Challenge[]> {
  return apiCall<Challenge[] | { challenges?: Challenge[] }>(
    "/challenges",
    {},
    () => store.selectChallenges() as Challenge[],
  ).then((payload) => Array.isArray(payload) ? payload : payload.challenges ?? []);
}

const DEFAULT_MILESTONE_PLAN: ProposedMilestone[] = [
  { title: "M1 · Solution architecture & integration", week: 4, deliverable: "Architecture sign-off and pilot integration plan", payment_percentage: 20 },
  { title: "M2 · Deployment & baseline measurement", week: 10, deliverable: "Live deployment at sites; baseline KPI reading captured", payment_percentage: 30 },
  { title: "M3 · Outcome delivery & verification", week: 18, deliverable: "Target KPI achievement verified by department", payment_percentage: 50 },
];

export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  return apiCall(
    "/proposals",
    {
      method: "POST",
      body: JSON.stringify({
        challenge_id: input.challenge_id,
        title: input.title,
        description: input.summary,
        solution_approach: input.solution_approach,
        timeline_weeks: input.timeline_weeks,
        budget_estimate: input.budget_estimate,
        team_description: (store.getCurrentUser() as User).bio ?? `${(store.getCurrentUser() as User).organization ?? ""} delivery team`,
        past_projects: "",
        status: "submitted",
      }),
    },
    () => {
      const me = store.getCurrentUser();
      return store.createProposal({
        challenge_id: input.challenge_id,
        title: input.title,
        description: input.summary,
        solution_approach: input.solution_approach,
        timeline_weeks: input.timeline_weeks,
        budget_estimate: input.budget_estimate,
        team_description: me.bio ?? `${me.organization ?? ""} delivery team`,
        trl_level: input.trl_level ?? 6,
        accepted_data_ip_clauses: true,
        proposed_milestones: input.proposed_milestones ?? DEFAULT_MILESTONE_PLAN,
        submission_notes: input.submission_notes,
      });
    },
  );
}

export async function submitMilestone(
  id: string,
  evidenceNames: string[],
): Promise<Milestone | null> {
  return apiCall(
    `/milestones/${encodeURIComponent(id)}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ evidenceNames }),
    },
    () => store.submitMilestone(id, evidenceNames),
  );
}

export async function signAgreement(id: string): Promise<PilotAgreement | null> {
  return apiCall(
    `/agreements/${encodeURIComponent(id)}/sign`,
    { method: "POST" },
    () => store.updateAgreementStatus(id, "signed_by_startup"),
  );
}

/* ------------------------------------------------------------------ */
/* Expert evaluator portal                                             */
/* ------------------------------------------------------------------ */

export async function fetchExpertPortal(): Promise<ExpertPortalData> {
  return apiCall(
    "/expert/portal",
    {},
    async () => {
      const me = store.getCurrentUser();
      const assignments = store.selectEvaluations().filter((e) => e.expert_id === me.id);
      const proposalIds = new Set(assignments.map((a) => a.proposal_id));
      const proposals = store.selectProposals().filter((p) => proposalIds.has(p.id));
      const challengeIds = new Set(proposals.map((p) => p.challenge_id));

      return {
        profile: me,
        assignments,
        proposals,
        challenges: store.selectChallenges().filter((c) => challengeIds.has(c.id)),
        panelEvaluations: store.selectEvaluations().filter((e) => {
          if (!proposalIds.has(e.proposal_id)) return false;
          const mine = assignments.find((a) => a.proposal_id === e.proposal_id);
          return mine?.status === "submitted";
        }),
        experts: store.listUsers("expert"),
      };
    },
  );
}

export async function fetchExpertProposals(): Promise<Proposal[]> {
  return apiCall(
    "/proposals/expert",
    {},
    () => {
      const me = store.getCurrentUser();
      const assignments = store.selectEvaluations().filter((evaluation) => evaluation.expert_id === me.id);
      const proposalIds = new Set(assignments.map((evaluation) => evaluation.proposal_id));
      return store.selectProposals()
        .filter((proposal) => proposalIds.has(proposal.id))
        .map((proposal) => ({
          ...proposal,
          startup_name: undefined,
          startup_org: undefined,
          startup_id: "",
          masked_company: "[MASKED_COMPANY]",
          masked_founder: "[MASKED_FOUNDER]",
          is_blinded: true,
        }));
    },
  );
}

export async function saveEvaluationDraft(
  id: string,
  patch: store.EvaluationSubmission,
): Promise<Evaluation | null> {
  return apiCall(
    `/evaluations/${encodeURIComponent(id)}/draft`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
    () => store.saveEvaluationDraft(id, patch),
  );
}

export async function submitEvaluation(
  id: string,
  patch: store.EvaluationSubmission,
): Promise<Evaluation | null> {
  return apiCall(
    `/evaluations/${encodeURIComponent(id)}/submit`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
    () => store.submitEvaluation(id, patch),
  );
}

export async function declareConflict(id: string, note: string): Promise<Evaluation | null> {
  return apiCall(
    `/evaluations/${encodeURIComponent(id)}/conflict`,
    {
      method: "PUT",
      body: JSON.stringify({ note }),
    },
    () => store.declareConflict(id, note),
  );
}

/* ------------------------------------------------------------------ */
/* Platform admin console                                              */
/* ------------------------------------------------------------------ */

export async function fetchAdminPortal(): Promise<AdminPortalData> {
  return apiCall(
    "/admin/portal",
    {},
    async () => ({
      users: store.listUsers(),
      challenges: store.selectChallenges(),
      proposals: store.selectProposals(),
      pilots: store.selectPilots(),
      milestones: store.selectMilestones(),
      kpis: store.selectKpis(),
      snapshots: store.selectSnapshots(),
      evaluations: store.selectEvaluations(),
      legalTemplates: store.selectLegalTemplates(),
      agreements: store.selectAgreements(),
      scaleDecisions: store.selectScaleDecisions(),
      meetings: store.selectMeetings(),
      activity: store.selectActivity(),
    }),
  );
}

export async function reviewMilestone(
  id: string,
  decision: "approved" | "rejected" | "under_review",
  notes: string,
): Promise<Milestone | null> {
  return apiCall(
    `/admin/milestones/${encodeURIComponent(id)}/review`,
    {
      method: "PUT",
      body: JSON.stringify({ decision, notes }),
    },
    () => store.reviewMilestone(id, decision, notes),
  );
}

export async function releasePayment(
  id: string,
  mode: Milestone["payment_mode"] = "PFMS",
): Promise<Milestone | null> {
  return apiCall(
    `/admin/milestones/${encodeURIComponent(id)}/payment`,
    {
      method: "POST",
      body: JSON.stringify({ mode }),
    },
    () => store.releaseMilestonePayment(id, mode),
  );
}

/** Alias used by the government console. */
export const releaseMilestonePayment = releasePayment;

export async function generateAgreement(input: {
  pilot_id: string;
  template_ids: string[];
  ip_ownership: PilotAgreement["ip_ownership"];
  data_classification: PilotAgreement["data_classification"];
  data_retention_months: number;
  data_residency_in_india: boolean;
  notes?: string;
}): Promise<PilotAgreement> {
  return apiCall(
    "/admin/agreements",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    () => store.generateAgreement(input),
  );
}

export async function updateAgreementStatus(
  id: string,
  status: PilotAgreement["status"],
): Promise<PilotAgreement | null> {
  return apiCall(
    `/admin/agreements/${encodeURIComponent(id)}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
    () => store.updateAgreementStatus(id, status),
  );
}

export async function setDpiitVerification(
  userId: string,
  verified: boolean,
): Promise<User | null> {
  return apiCall(
    `/admin/users/${encodeURIComponent(userId)}/dpiit`,
    {
      method: "PUT",
      body: JSON.stringify({ verified }),
    },
    () => store.setDpiitVerification(userId, verified),
  );
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<User | null> {
  return apiCall(
    `/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
    () => store.updateUser(userId, patch),
  );
}

/* ------------------------------------------------------------------ */
/* Procurement & scale-up                                              */
/* ------------------------------------------------------------------ */

export async function fetchScaleDecisions(): Promise<ScaleDecision[]> {
  return apiCall("/admin/scale-decisions", {}, () => store.selectScaleDecisions());
}

export async function createScaleDecision(
  input: Parameters<typeof store.createScaleDecision>[0],
): Promise<ScaleDecision | null> {
  return apiCall(
    "/admin/scale-decisions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    () => store.createScaleDecision(input),
  );
}

export async function advanceGemStage(
  id: string,
  patch: Partial<ScaleDecision["gem"]>,
): Promise<ScaleDecision | null> {
  return apiCall(
    `/admin/scale-decisions/${encodeURIComponent(id)}/gem`,
    {
      method: "PUT",
      body: JSON.stringify(patch),
    },
    () => store.advanceGemStage(id, patch),
  );
}

export async function actOnApproval(
  decisionId: string,
  stage: string,
  status: "approved" | "rejected",
  remark: string,
): Promise<ScaleDecision | null> {
  return apiCall(
    `/admin/scale-decisions/${encodeURIComponent(decisionId)}/approval`,
    {
      method: "PUT",
      body: JSON.stringify({ stage, status, remark }),
    },
    () => store.actOnApproval(decisionId, stage, status, remark),
  );
}

export async function fetchReadiness(pilotId: string): Promise<ReadinessScorecard> {
  return apiCall(
    `/pilots/${encodeURIComponent(pilotId)}/readiness`,
    {},
    () => store.readinessScorecard(pilotId),
  );
}

export async function fetchKpiAchievement(kpi: Kpi): Promise<number | undefined> {
  return apiCall(
    `/kpis/${encodeURIComponent(kpi.id)}/achievement`,
    {},
    () => store.kpiAchievement(kpi),
  );
}

export async function fetchMilestones(pilotId?: string): Promise<Milestone[]> {
  const qs = pilotId ? `?pilot_id=${encodeURIComponent(pilotId)}` : "";
  return apiCall<Milestone[] | { milestones?: Milestone[] }>(
    `/milestones${qs}`,
    {},
    () => store.selectMilestones().filter((m) => (pilotId ? m.pilot_id === pilotId : true)),
  ).then((payload) => (Array.isArray(payload) ? payload : payload.milestones ?? []));
}

export async function fetchContracts(pilotId?: string): Promise<PilotAgreement[]> {
  const qs = pilotId ? `?pilot_id=${encodeURIComponent(pilotId)}` : "";
  return apiCall<PilotAgreement[] | { contracts?: PilotAgreement[] }>(
    `/contracts${qs}`,
    {},
    () => store.selectAgreements().filter((c) => (pilotId ? c.pilot_id === pilotId : true)),
  ).then((payload) => (Array.isArray(payload) ? payload : payload.contracts ?? []));
}

export async function sendContract(id: string): Promise<PilotAgreement | null> {
  return apiCall(
    `/contracts/${encodeURIComponent(id)}/send`,
    { method: "PUT" },
    () => store.updateAgreementStatus(id, "sent_to_startup"),
  );
}

export async function signContractWithOtp(id: string, otp: string): Promise<PilotAgreement | null> {
  return apiCall(
    `/contracts/${encodeURIComponent(id)}/sign`,
    { method: "PUT", body: JSON.stringify({ otp }) },
    () => store.updateAgreementStatus(id, "signed_by_startup"),
  );
}

export async function executeContract(id: string, executedBy?: string): Promise<PilotAgreement | null> {
  return apiCall(
    `/contracts/${encodeURIComponent(id)}/execute`,
    { method: "PUT", body: JSON.stringify({ executed_by: executedBy }) },
    () => store.updateAgreementStatus(id, "executed"),
  );
}

export async function fetchMeetings(pilotId?: string): Promise<PilotMeeting[]> {
  const qs = pilotId ? `?pilot_id=${encodeURIComponent(pilotId)}` : "";
  return apiCall<PilotMeeting[] | { meetings?: PilotMeeting[] }>(
    `/meetings${qs}`,
    {},
    () => store.selectMeetings(pilotId),
  ).then((payload) => (Array.isArray(payload) ? payload : payload.meetings ?? []));
}

export async function scheduleMeeting(
  input: Omit<PilotMeeting, "id" | "created_at">,
): Promise<PilotMeeting> {
  return apiCall(
    "/meetings",
    { method: "POST", body: JSON.stringify(input) },
    () => store.createMeeting(input),
  );
}

export async function updateMeeting(
  id: string,
  patch: Partial<PilotMeeting>,
): Promise<PilotMeeting | null> {
  return apiCall(
    `/meetings/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(patch) },
    () => store.updateMeeting(id, patch),
  );
}

export async function fetchScreening(startupId: string): Promise<{
  status: string;
  confidence: number;
  reasons: string[];
  gfr: { eligible: boolean; maxPilotBudgetInr: number; clause: string; rationale: string };
  checks: Record<string, any>;
}> {
  return apiCall(
    `/screening/${encodeURIComponent(startupId)}`,
    {},
    () => ({
      status: "approved",
      confidence: 0.94,
      reasons: ["No blocking issues identified."],
      gfr: { eligible: true, maxPilotBudgetInr: 5000000, clause: "GFR exemption approved", rationale: "DPIIT recognised TRL 8" },
      checks: { dpiit_valid: true, trl_level: 8, team_size: 15, turnover: 15000000 },
    }),
  );
}

export async function updatePilotProgress(
  id: string,
  progress_percentage: number,
  notes?: string,
): Promise<Pilot | null> {
  return apiCall(
    `/pilots/${encodeURIComponent(id)}/progress`,
    { method: "PUT", body: JSON.stringify({ progress_percentage, notes }) },
    () => store.updatePilot(id, { progress_percentage, summary: notes }),
  );
}

/* ------------------------------------------------------------------ */
/* Synchronous helpers (safe to call during render)                     */
/* ------------------------------------------------------------------ */

export const {
  computeWeightedScore,
  recommendationFromScore,
  kpiAchievement,
  pilotKpiAchievement,
  readinessScorecard,
  latestSnapshot,
} = store;
