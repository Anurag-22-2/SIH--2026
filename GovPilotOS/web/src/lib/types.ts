/**
 * GovPilot OS — domain model
 *
 * Implements SIH Problem Statement 26136 for the Maharashtra State Innovation
 * Society (MSINS): an outcome-based government innovation pilot platform with
 * four roles (Government Officer, Startup, Expert Evaluator, Platform Admin),
 * milestone-linked payments, legal templates and a GeM procurement/scale-up
 * pathway.
 *
 * All monetary values are Indian Rupees (INR), stored as plain numbers.
 */

/* ------------------------------------------------------------------ */
/* Roles & users                                                       */
/* ------------------------------------------------------------------ */

export type Role = "government" | "startup" | "expert" | "admin";

/** Civic sectors covered by the MSINS challenge pipeline. */
export type Sector = "PWD" | "Urban Waste" | "Water Quality";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  organization?: string;
  designation?: string;
  department?: string;
  district?: string;
  phone?: string;
  bio?: string;
  /** Expert reviewers: comma separated domains. */
  expertise?: string;
  /** Sectors this user works across (officers, experts, startups). */
  sectors?: Sector[];

  /* Startup-specific compliance fields (DPIIT / MCA / GST) */
  dpiit_number?: string;
  dpiit_verified?: boolean;
  dpiit_valid_till?: string;
  cin?: string;
  gstin?: string;
  incorporation_year?: number;
  team_size?: number;
  /** Udyam / MSME registration number. */
  udyam_number?: string;
  /** Empanelment under an MSINS programme. */
  msins_programme?: string;

  /* Startup financial details (Profit / Loss statement) */
  /** Financial year period of the latest P&L, e.g. "FY 2025-26". */
  profit_loss_period?: string;
  /** Annual revenue / turnover in INR from the latest financial year. */
  annual_turnover?: number;
  /** Profit (positive) or loss (negative) in INR from the latest financial year. */
  annual_profit_loss?: number;
  /** URL or file reference for the uploaded P&L / balance sheet. */
  financial_doc_url?: string;
}

/* ------------------------------------------------------------------ */
/* Challenges (outcome-based formulation)                              */
/* ------------------------------------------------------------------ */

export type ChallengeStatus =
  | "draft"
  | "under_review"
  | "published"
  | "open"
  | "in_review"
  | "piloting"
  | "closed"
  | "cancelled"
  | "application_open"
  | "evaluation"
  | "shortlisted"
  | "pilot"
  | "completed"
  | "scale_up";

export type Priority = "low" | "medium" | "high" | "critical";

/** A measurable outcome target attached to a challenge at formulation time. */
export interface OutcomeTarget {
  id: string;
  statement: string;
  baseline: string;
  target: string;
  measurement_method: string;
}

export interface ChallengeEligibility {
  /** DPIIT recognition is mandatory for MSINS pilot funding. */
  dpiit_required: boolean;
  /** Minimum Technology Readiness Level (1-9). */
  min_trl: number;
  /** Registered/operating presence in Maharashtra required. */
  maharashtra_presence_required: boolean;
  /** Free-form additional conditions shown to startups. */
  conditions: string[];
}

export interface OriginalProblemInput {
  title: string;
  description: string;
  department?: string;
  location?: string;
  affected_users?: string;
  current_impact?: string;
  budget?: string;
  timeline?: string;
  existing_system?: string;
  additional_information?: string;
}

export interface AIAnalysisOutput {
  problem_statement: string;
  executive_summary: string;
  category: string;
  sub_category?: string;
  challenge_type?: string;
  affected_stakeholders: string[];
  current_state?: string;
  key_pain_points: string[];
  desired_outcomes: string[];
  suggested_kpis: {
    name: string;
    baseline: string;
    target: string;
    unit: string;
    measurement_method: string;
  }[];
  innovation_areas: string[];
  suggested_solution_scope: string;
  technical_requirements: string[];
  functional_requirements: string[];
  non_functional_requirements: string[];
  data_requirements: string[];
  security_considerations: string[];
  risks: { risk: string; probability: string; impact: string; mitigation: string }[];
  pilot_duration: string;
  pilot_scope: string;
  success_criteria: string[];
  suggested_evaluation_criteria: { criterion: string; weight: number }[];
  estimated_budget_range: string;
  ai_confidence: number;
  missing_information: string[];
  ai_reasoning_summary: string;
}

export interface AIAnalysisRecord {
  id: string;
  challenge_id: string;
  input_snapshot: OriginalProblemInput;
  output_json: AIAnalysisOutput;
  provider: string;
  model: string;
  confidence: number;
  created_by: string;
  created_at: string;
}

export interface ChallengeReview {
  id: string;
  challenge_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_role: Role;
  rating: number;
  comment: string;
  is_private: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  /** Government file reference, e.g. MSINS/PWD/2026/001. */
  challenge_code: string;
  title: string;
  description: string;
  problem_statement: string;
  desired_outcomes: string;
  success_criteria: string;
  sector: Sector;
  department: string;
  district: string;
  /** Human readable range, e.g. "₹45 L – ₹1.2 Cr". */
  budget_range?: string;
  budget_min: number;
  budget_max: number;
  duration_weeks: number;
  status: ChallengeStatus;
  priority: Priority;
  contact_person?: string;
  contact_email?: string;
  tags?: string;
  /** Outcome-based targets defined by the sponsoring officer. */
  outcome_targets: OutcomeTarget[];
  eligibility: ChallengeEligibility;
  /** Criterion key -> weight (sums to 1). Drives the evaluation matrix. */
  evaluation_weights: Record<EvaluationCriterionKey, number>;
  /** Expert user IDs empanelled on the scoring panel. */
  expert_panel: string[];
  min_expert_evaluations: number;
  submission_deadline?: string;
  /** MSINS programme under which the challenge is funded. */
  msins_programme?: string;
  original_problem?: OriginalProblemInput;
  ai_analysis?: AIAnalysisOutput;
  ai_history?: AIAnalysisRecord[];
  reviews?: ChallengeReview[];
  published_at?: string;
  published_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Proposals                                                           */
/* ------------------------------------------------------------------ */

export type ProposalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "piloting"
  | "completed"
  | "scaled";

/** Milestone plan proposed by the startup at submission time. */
export interface ProposedMilestone {
  title: string;
  week: number;
  deliverable: string;
  payment_percentage: number;
}

export interface Proposal {
  id: string;
  challenge_id: string;
  startup_id: string;
  title: string;
  description: string;
  solution_approach: string;
  timeline_weeks: number;
  budget_estimate: number;
  team_description: string;
  past_projects?: string;
  trl_level: number;
  gfr_exemption?: {
    eligible: boolean;
    max_pilot_budget_inr: number;
    clause: string;
    rationale: string;
  };
  success_probability?: number;
  ai_score?: number;
  gfr_eligible?: boolean;
  eligible_for_direct_gfr_exemption?: boolean;
  blind_evaluation?: {
    masked_company: string;
    masked_founder: string;
    is_blinded: boolean;
  };
  masked_company?: string;
  masked_founder?: string;
  is_blinded?: boolean;

  /* Compliance snapshot captured at submission */
  dpiit_number: string;
  dpiit_verified: boolean;
  cin?: string;
  gstin?: string;
  /** Financial details captured from the startup registration at submission time. */
  annual_turnover?: number;
  annual_profit_loss?: number;
  profit_loss_period?: string;
  financial_doc_url?: string;
  /** Startup accepted the data-handling + IP clauses of the pilot agreement. */
  accepted_data_ip_clauses: boolean;

  proposed_milestones: ProposedMilestone[];

  /* Panel outcome (derived from expert evaluations) */
  criterion_scores?: Partial<Record<EvaluationCriterionKey, number>>;
  weighted_score?: number;
  evaluations_count?: number;
  panel_recommendation?: EvaluationRecommendation;

  status: ProposalStatus;
  submission_notes?: string;
  /*   * Denormalised for display. */
  startup_name?: string;
  startup_org?: string;
  startup_district?: string;
  startup_team_size?: number;
  startup_udyam_number?: string;
  challenge_title?: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Expert evaluation matrix                                            */
/* ------------------------------------------------------------------ */

export type EvaluationCriterionKey =
  | "tech_novelty"
  | "feasibility"
  | "cost_efficiency"
  | "scalability"
  | "team_capability"
  | "compliance";

export interface EvaluationCriterion {
  key: EvaluationCriterionKey;
  label: string;
  short_label: string;
  description: string;
  /** Default weight when a challenge does not override it. */
  default_weight: number;
  max_score: number;
  /** Anchors shown to the evaluator for 1 / 3 / 5 scores. */
  anchors: { score: number; guidance: string }[];
}

export type EvaluationRecommendation =
  | "strongly_reject"
  | "reject"
  | "neutral"
  | "accept"
  | "strongly_accept";

export type EvaluationStatus = "assigned" | "in_progress" | "submitted";

export interface Evaluation {
  id: string;
  proposal_id: string;
  expert_id: string;
  /** Score (1-5) per matrix criterion. */
  scores: Partial<Record<EvaluationCriterionKey, number>>;
  /** Optional per-criterion justification. */
  criterion_notes?: Partial<Record<EvaluationCriterionKey, string>>;
  /** Weighted total on a 5-point scale, computed from challenge weights. */
  weighted_score?: number;
  overall_comment?: string;
  strengths?: string;
  risks?: string;
  recommendation?: EvaluationRecommendation;
  confidence_level?: number;
  /** Independent panel integrity: declared conflict of interest. */
  conflict_of_interest: boolean;
  conflict_note?: string;
  status: EvaluationStatus;
  due_date?: string;
  submitted_at?: string;
  /** Denormalised for display. */
  expert_name?: string;
  expert_org?: string;
  proposal_title?: string;
  challenge_title?: string;
  startup_org?: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Pilots, milestones & payments                                       */
/* ------------------------------------------------------------------ */

export type PilotStatus =
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "terminated"
  | "scaled";

export interface Pilot {
  id: string;
  /** Human-friendly pilot name (defaults to the proposal title at creation). */
  title?: string;
  /** Work order reference issued by the department. */
  work_order_no: string;
  proposal_id: string;
  challenge_id: string;
  startup_id: string;
  status: PilotStatus;
  start_date?: string;
  end_date?: string;
  budget_allocated: number;
  budget_spent: number;
  progress_percentage: number;
  summary?: string;
  outcomes?: string;
  lessons_learned?: string;
  /** Departmental nodal officer for the deployment. */
  nodal_officer?: string;
  deployment_sites?: string[];
  /** Denormalised for display. */
  challenge_title?: string;
  sector?: Sector;
  district?: string;
  startup_name?: string;
  startup_org?: string;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "paid";

export interface MilestoneEvidence {
  name: string;
  kind: "report" | "dataset" | "photo" | "certificate" | "invoice" | "video";
  uploaded_at: string;
}

export interface Milestone {
  id: string;
  pilot_id: string;
  seq: number;
  title: string;
  description: string;
  deliverables: string[];
  due_date: string;
  /** Tranche value in INR. */
  amount: number;
  payment_percentage: number;
  status: MilestoneStatus;
  evidence: MilestoneEvidence[];
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  /** Payment release details once the tranche is disbursed. */
  paid_at?: string;
  payment_utr?: string;
  payment_mode?: "PFMS" | "NEFT" | "RTGS";
  /** KPI ids this milestone is expected to move. */
  kpi_links: string[];
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export type KpiMetricType = "quantitative" | "qualitative" | "milestone";

/** Whether a higher or lower reported value is better. */
export type KpiDirection = "increase" | "decrease";

export interface Kpi {
  id: string;
  challenge_id?: string;
  pilot_id?: string;
  name: string;
  description?: string;
  metric_type: KpiMetricType;
  unit?: string;
  baseline_value?: number;
  target_value?: number;
  target_description?: string;
  direction: KpiDirection;
  weight: number;
  frequency?: "weekly" | "fortnightly" | "monthly" | "quarterly";
  /** Department team accountable for verification. */
  owner?: string;
}

export interface KpiSnapshot {
  id: string;
  kpi_id: string;
  pilot_id: string;
  reported_value?: number;
  reported_text?: string;
  notes?: string;
  period?: string;
  reported_by: string;
  /** Third-party / departmental verification of the reported value. */
  verified: boolean;
  verified_by?: string;
  kpi_name?: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Legal templates & pilot agreements                                  */
/* ------------------------------------------------------------------ */

export type LegalCategory =
  | "agreement"
  | "data"
  | "ip"
  | "payment"
  | "procurement"
  | "exit";

export interface LegalClause {
  heading: string;
  body: string;
  mandatory: boolean;
}

export interface LegalTemplate {
  id: string;
  code: string;
  name: string;
  category: LegalCategory;
  version: string;
  description: string;
  clauses: LegalClause[];
  /** Statutes / policies the template is aligned to. */
  compliance_refs: string[];
  applicable_to: Sector[] | "all";
  owner: string;
  status: "active" | "draft" | "retired";
  last_updated: string;
}

export type AgreementStatus =
  | "draft"
  | "sent_to_startup"
  | "signed_by_startup"
  | "executed"
  | "terminated";

export interface PilotAgreement {
  id: string;
  pilot_id: string;
  /** Templates bundled into this agreement pack. */
  template_ids: string[];
  reference_no: string;
  status: AgreementStatus;
  ip_ownership: "government_owned" | "startup_owned_govt_licence" | "joint";
  data_classification: "public" | "restricted" | "confidential";
  data_retention_months: number;
  /** Whether personal data leaves state-controlled infrastructure. */
  data_residency_in_india: boolean;
  generated_at: string;
  sent_at?: string;
  startup_signed_at?: string;
  executed_at?: string;
  executed_by?: string;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Procurement & scale-up (GeM pathway)                                */
/* ------------------------------------------------------------------ */

export type ScaleDecisionType =
  | "gem_procurement"
  | "scale_pilot"
  | "iterate"
  | "exit";

export type GemStage =
  | "not_started"
  | "category_mapped"
  | "listed"
  | "bid_published"
  | "contract_awarded";

export interface GemProcurement {
  /** GeM product/service category name. */
  category: string;
  /** GeM category code, e.g. GeM/Cat/WQM/4471. */
  category_code: string;
  stage: GemStage;
  listing_id?: string;
  bid_reference?: string;
  /** Bid mode used for scale-up. */
  mode?: "direct_purchase" | "l1_bid" | "custom_bid" | "startup_runway";
  contract_value?: number;
  contract_awarded_on?: string;
  /** Startup Runway exemption from prior turnover/experience criteria. */
  startup_runway_exemption: boolean;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalStep {
  stage: string;
  authority: string;
  status: ApprovalStatus;
  acted_on?: string;
  remark?: string;
}

export interface ScaleScope {
  districts: string[];
  units: string;
  population_covered: number;
}

export interface ScaleDecision {
  id: string;
  pilot_id: string;
  proposal_id: string;
  challenge_id: string;
  decision: ScaleDecisionType;
  reasoning: string;
  next_steps: string;
  budget_allocated: number;
  timeline_months: number;
  scale_scope: ScaleScope;
  gem: GemProcurement;
  approvals: ApprovalStep[];
  decided_by: string;
  decided_at: string;
  /** Denormalised for display. */
  pilot_title?: string;
  startup_org?: string;
}

/** Computed pilot readiness used to recommend a scale-up decision. */
export interface ReadinessScorecard {
  pilot_id: string;
  kpi_achievement: number;
  milestone_completion: number;
  evaluation_score: number;
  budget_adherence: number;
  composite: number;
  recommendation: ScaleDecisionType;
  rationale: string[];
}

/* ------------------------------------------------------------------ */
/* Platform plumbing                                                   */
/* ------------------------------------------------------------------ */

export interface ActivityEntry {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  related_id?: string;
  related_type?: string;
  read: boolean;
  created_at: string;
}

export interface PilotMeeting {
  id: string;
  pilot_id: string;
  title: string;
  date: string;
  attendees: string[];
  agenda: string;
  notes?: string;
  action_items?: string[];
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

/** Full platform snapshot — every dashboard reads from this shape. */
export interface PlatformData {
  users: User[];
  challenges: Challenge[];
  proposals: Proposal[];
  evaluations: Evaluation[];
  pilots: Pilot[];
  milestones: Milestone[];
  kpis: Kpi[];
  snapshots: KpiSnapshot[];
  legalTemplates: LegalTemplate[];
  agreements: PilotAgreement[];
  scaleDecisions: ScaleDecision[];
  meetings: PilotMeeting[];
  activity: ActivityEntry[];
  notifications: Notification[];
}

/** Government officer view. */
export interface DashboardData {
  challenges: Challenge[];
  proposals: Proposal[];
  pilots: Pilot[];
  milestones: Milestone[];
  kpis: Kpi[];
  snapshots: KpiSnapshot[];
  evaluations: Evaluation[];
  scaleDecisions: ScaleDecision[];
  contracts: PilotAgreement[];
  meetings: PilotMeeting[];
  experts: User[];
}

/** Startup portal view. */
export interface StartupPortalData {
  profile: User;
  availableChallenges: Challenge[];
  myProposals: Proposal[];
  myPilots: Pilot[];
  myMilestones: Milestone[];
  myKpis: Kpi[];
  mySnapshots: KpiSnapshot[];
  myEvaluations: Evaluation[];
  myAgreements: PilotAgreement[];
  myMeetings: PilotMeeting[];
  legalTemplates: LegalTemplate[];
}

/** Expert evaluator view. */
export interface ExpertPortalData {
  profile: User;
  assignments: Evaluation[];
  proposals: Proposal[];
  challenges: Challenge[];
  /** Every submitted evaluation on the proposals this expert can see. */
  panelEvaluations: Evaluation[];
  experts: User[];
}

/** Platform admin view. */
export interface AdminPortalData {
  users: User[];
  challenges: Challenge[];
  proposals: Proposal[];
  pilots: Pilot[];
  milestones: Milestone[];
  kpis: Kpi[];
  snapshots: KpiSnapshot[];
  evaluations: Evaluation[];
  legalTemplates: LegalTemplate[];
  agreements: PilotAgreement[];
  scaleDecisions: ScaleDecision[];
  meetings: PilotMeeting[];
  activity: ActivityEntry[];
}

/* ------------------------------------------------------------------ */
/* Challenge copilot (AI-assisted formulation)                         */
/* ------------------------------------------------------------------ */

export interface AiKpi {
  name: string;
  description: string;
  metric_type: KpiMetricType;
  unit?: string;
  baseline_value?: number;
  target_value?: number;
  direction: KpiDirection;
  weight: number;
}

export interface AiPilotScope {
  duration_weeks: number;
  budget_min: number;
  budget_max: number;
  budget_range: string;
  departments: string[];
  districts: string[];
  constraints: string;
}

export interface AiEvaluationDimension {
  dimension: string;
  key: EvaluationCriterionKey;
  description: string;
  weight: number;
}

export interface AiEvaluationFramework {
  scoringDimensions: AiEvaluationDimension[];
  thresholds: {
    strongly_accept: string;
    accept: string;
    neutral: string;
    reject: string;
  };
}

export interface AiGeneratedChallenge {
  suggested_title: string;
  suggested_tags: string;
  sector: Sector;
  problem_statement: string;
  desired_outcomes: string;
  success_criteria: string;
  outcome_targets: OutcomeTarget[];
  kpis: AiKpi[];
  pilot_scope: AiPilotScope;
  eligibility_criteria: string[];
  evaluation_framework: AiEvaluationFramework;
  suggested_milestones: ProposedMilestone[];
}
