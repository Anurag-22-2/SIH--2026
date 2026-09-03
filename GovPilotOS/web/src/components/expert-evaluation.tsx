"use client";

import * as React from "react";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  KeyValue,
  Loading,
  ScoreInput,
  SectionLabel,
  StatCard,
  Tabs,
  Tag,
  Textarea,
} from "./ui";
import { Chips, CriterionBars, ScoreChip, StatusBadge } from "./shared";
import {
  declareConflict,
  fetchExpertPortal,
  fetchExpertProposals,
  getGfrFastTrackStatus,
  getSuccessProbabilityScore,
  maskStartupIdentity,
  saveEvaluationDraft,
  submitEvaluation,
} from "@/lib/api";
import { computeWeightedScore, recommendationFromScore } from "@/lib/api";
import { EVALUATION_MATRIX } from "@/lib/mock-data";
import { formatInrCompact, formatCurrency, humanise } from "@/lib/utils";
import type {
  Challenge,
  Evaluation,
  EvaluationCriterionKey,
  EvaluationRecommendation,
  ExpertPortalData,
  Proposal,
  User,
} from "@/lib/types";

const RECOMMENDATIONS: EvaluationRecommendation[] = [
  "strongly_reject",
  "reject",
  "neutral",
  "accept",
  "strongly_accept",
];

export function ExpertEvaluation() {
  const [data, setData] = React.useState<ExpertPortalData | null>(null);
  const [tab, setTab] = React.useState("assignments");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const [portal, proposals] = await Promise.all([fetchExpertPortal(), fetchExpertProposals()]);
    setData({ ...portal, proposals });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return <Loading label="Loading Expert panel…" />;

  const pending = data.assignments.filter((a) => a.status !== "submitted");
  const recused = data.assignments.filter((a) => a.conflict_of_interest);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Expert Evaluator Console</h2>
        <p className="text-sm text-slate-500">
          {data.profile.full_name} · independent, conflict-of-interest screened scoring panel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Assignments" value={data.assignments.length} hint="Total" />
        <StatCard label="To score" value={pending.length} hint="Awaiting your review" />
        <StatCard label="Submitted" value={data.assignments.length - pending.length} hint="Completed" />
        <StatCard label="Recused" value={recused.length} hint="Conflict declared" />
      </div>

      <Tabs
        tabs={[
          { id: "assignments", label: `My assignments (${data.assignments.length})` },
          { id: "consensus", label: "Panel consensus" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "assignments" && <AssignmentsTab data={data} onChanged={refresh} />}
      {tab === "consensus" && <ConsensusTab data={data} />}

      {busy && <Loading label="Working…" />}
    </div>
  );
}

function AssignmentsTab({ data, onChanged }: { data: ExpertPortalData; onChanged: () => void }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = data.assignments.find((a) => a.id === openId) ?? null;
  const proposal = open ? data.proposals.find((p) => p.id === open.proposal_id) : null;
  const challenge = proposal ? data.challenges.find((c) => c.id === proposal.challenge_id) : null;

  return (
    <div className="space-y-4">
      {data.assignments.length === 0 ? (
        <EmptyState title="No evaluations assigned" hint="The Government Officer convenes the panel and assigns you to proposals." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.assignments.map((a) => {
            const p = data.proposals.find((x) => x.id === a.proposal_id);
            const maskedCompany = p?.masked_company ?? "[MASKED_COMPANY]";
            const gfr = p ? getGfrFastTrackStatus(p) : null;
            const successProbability = p ? getSuccessProbabilityScore(p) : null;
            return (
              <Card
                key={a.id}
                className={a.conflict_of_interest ? "border-amber-200 bg-amber-50/40" : "cursor-pointer hover:border-slate-300"}
                onClick={() => !a.conflict_of_interest && setOpenId(a.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{maskedCompany}</p>
                    <p className="text-xs font-medium text-slate-500">{p?.masked_founder ?? "[MASKED_FOUNDER]"}</p>
                    <p className="text-xs text-slate-500">{p?.challenge_title}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  {typeof successProbability === "number" && (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 font-medium text-sky-700">Success {successProbability}%</span>
                  )}
                  {gfr?.eligible && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">GFR fast-track</span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {a.conflict_of_interest ? "Recused — conflict declared" : humanise(a.status)}
                  </span>
                  <ScoreChip value={a.weighted_score} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && proposal && (
        <EvaluationDialog
          evaluation={open}
          proposal={proposal}
          challenge={challenge ?? null}
          onClose={() => setOpenId(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function EvaluationDialog({
  evaluation,
  proposal,
  challenge,
  onClose,
  onChanged,
}: {
  evaluation: Evaluation;
  proposal: Proposal;
  challenge: Challenge | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [scores, setScores] = React.useState<Partial<Record<EvaluationCriterionKey, number>>>({
    ...evaluation.scores,
  });
  const [comment, setComment] = React.useState(evaluation.overall_comment ?? "");
  const [strengths, setStrengths] = React.useState(evaluation.strengths ?? "");
  const [risks, setRisks] = React.useState(evaluation.risks ?? "");
  const [recommendation, setRecommendation] = React.useState<EvaluationRecommendation | "">(
    evaluation.recommendation ?? "",
  );
  const [conflictNote, setConflictNote] = React.useState("");
  const [showConflict, setShowConflict] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const gfr = getGfrFastTrackStatus(proposal);
  const successProbability = getSuccessProbabilityScore(proposal);
  const weighted = computeWeightedScore(scores);

  function setScore(key: EvaluationCriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  async function save(draft: boolean) {
    setBusy(true);
    const patch = {
      scores,
      overall_comment: comment,
      strengths,
      risks,
      recommendation: draft ? undefined : (recommendation || recommendationFromScore(weighted ?? 0)) as EvaluationRecommendation,
    };
    if (draft) await saveEvaluationDraft(evaluation.id, patch);
    else await submitEvaluation(evaluation.id, patch);
    setBusy(false);
    onChanged();
    if (!draft) onClose();
  }

  async function recuse() {
    setBusy(true);
    await declareConflict(evaluation.id, conflictNote);
    setBusy(false);
    onChanged();
    onClose();
  }

  return (
    <Dialog
      open
      title={`Evaluate · ${proposal.masked_company ?? "[MASKED_COMPANY]"}`}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{proposal.challenge_title}</Tag>
          <Tag tone="info">{formatInrCompact(proposal.budget_estimate)}</Tag>
          {proposal.dpiit_verified && <Tag tone="success">DPIIT verified</Tag>}
          {gfr.eligible && <Tag tone="success">GFR fast-track</Tag>}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-medium">AI Predictive Success Score</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">{successProbability}%</span>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Challenge context: full problem statement                        */}
        {/* ---------------------------------------------------------------- */}
        {challenge && (
          <div>
            <SectionLabel>Challenge — Problem statement</SectionLabel>
            <p className="mt-1 text-sm text-slate-700">{challenge.problem_statement}</p>
            {challenge.desired_outcomes && (
              <>
                <div className="mt-3">
                  <SectionLabel>Desired outcomes</SectionLabel>
                </div>
                <p className="mt-1 text-sm text-slate-700">{challenge.desired_outcomes}</p>
              </>
            )}
            {challenge.success_criteria && (
              <>
                <div className="mt-3">
                  <SectionLabel>Success criteria</SectionLabel>
                </div>
                <p className="mt-1 text-sm text-slate-700">{challenge.success_criteria}</p>
              </>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Proposed solution                                               */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <SectionLabel>Proposed solution</SectionLabel>
          <p className="mt-1 text-sm text-slate-700">{proposal.description || proposal.solution_approach}</p>
          {proposal.solution_approach && proposal.solution_approach !== proposal.description && (
            <>
              <div className="mt-2">
                <SectionLabel>Solution approach</SectionLabel>
              </div>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{proposal.solution_approach}</p>
            </>
          )}
          {proposal.team_description && (
            <>
              <div className="mt-2">
                <SectionLabel>Team</SectionLabel>
              </div>
              <p className="mt-1 text-sm text-slate-700">{proposal.team_description}</p>
            </>
          )}
          {proposal.past_projects && (
            <>
              <div className="mt-2">
                <SectionLabel>Past projects</SectionLabel>
              </div>
              <p className="mt-1 text-sm text-slate-700">{proposal.past_projects}</p>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Startup company details                                         */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <SectionLabel>Startup company details</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KeyValue label="Company" value={proposal.masked_company ?? "[MASKED_COMPANY]"} />
            <KeyValue label="Founder" value={proposal.masked_founder ?? "[MASKED_FOUNDER]"} />
            <KeyValue label="TRL level" value={String(proposal.trl_level)} />
            <KeyValue label="DPIIT" value={proposal.dpiit_number ?? "—"} />
            <KeyValue label="DPIIT status" value={proposal.dpiit_verified ? "Verified" : "Pending"} />
            <KeyValue label="CIN" value={proposal.cin ?? "—"} />
            <KeyValue label="GSTIN" value={proposal.gstin ?? "—"} />
            {proposal.startup_team_size != null && (
              <KeyValue label="Team size" value={String(proposal.startup_team_size)} />
            )}
            {proposal.startup_udyam_number && (
              <KeyValue label="Udyam number" value={proposal.startup_udyam_number} />
            )}
            {proposal.profit_loss_period && (
              <KeyValue label="Financial period" value={proposal.profit_loss_period} />
            )}
            {proposal.annual_turnover != null && (
              <KeyValue label="Annual turnover" value={formatInrCompact(proposal.annual_turnover)} />
            )}
            {proposal.annual_profit_loss != null && (
              <KeyValue
                label="Profit / Loss"
                value={formatCurrency(proposal.annual_profit_loss)}
              />
            )}
          </div>
        </div>

        <div>
          <SectionLabel>Evaluation matrix (1–5, weighted)</SectionLabel>
          <div className="mt-3 space-y-4">
            {EVALUATION_MATRIX.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-slate-400">
                      Weight {Math.round(c.default_weight * 100)}%
                    </p>
                  </div>
                  <ScoreInput
                    value={scores[c.key]}
                    onChange={(v) => setScore(c.key, v)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{c.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 p-3">
            <span className="text-xs font-medium text-slate-600">Weighted score</span>
            <ScoreChip value={weighted} />
          </div>
        </div>

        <Field label="Overall comment">
          <Textarea value={comment} onChange={setComment} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Strengths">
            <Textarea value={strengths} onChange={setStrengths} />
          </Field>
          <Field label="Risks / mitigations">
            <Textarea value={risks} onChange={setRisks} />
          </Field>
        </div>

        <Field label="Recommendation">
          <select
            className="kilo-input"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as EvaluationRecommendation)}
          >
            <option value="">Auto ({weighted != null ? humanise(recommendationFromScore(weighted)) : "—"})</option>
            {RECOMMENDATIONS.map((r) => (
              <option key={r} value={r}>
                {humanise(r)}
              </option>
            ))}
          </select>
        </Field>

        {!showConflict ? (
          <button className="text-xs font-medium text-amber-700 hover:underline" onClick={() => setShowConflict(true)}>
            Declare a conflict of interest / recuse
          </button>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <Field label="Conflict note (required to recuse)">
              <Textarea value={conflictNote} onChange={setConflictNote} />
            </Field>
            <Button
              size="sm"
              variant="danger"
              disabled={busy || conflictNote.trim().length === 0}
              onClick={recuse}
            >
              Confirm recusal
            </Button>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={() => save(true)} disabled={busy}>
            Save draft
          </Button>
          <Button onClick={() => save(false)} disabled={busy || Object.keys(scores).length === 0}>
            {busy ? "Submitting…" : "Submit evaluation"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------ Consensus -------------------------------- */

function ConsensusTab({ data }: { data: ExpertPortalData }) {
  if (data.panelEvaluations.length === 0) {
    return (
      <EmptyState
        title="No consensus yet"
        hint="Once you and your co-evaluators submit scores, the panel consensus appears here. Single-evaluator anchoring is prevented."
      />
    );
  }

  // Group submitted evaluations by proposal.
  const byProposal = new Map<string, Evaluation[]>();
  for (const e of data.panelEvaluations) {
    if (!byProposal.has(e.proposal_id)) byProposal.set(e.proposal_id, []);
    byProposal.get(e.proposal_id)!.push(e);
  }

  return (
    <div className="space-y-4">
      {Array.from(byProposal.entries()).map(([proposalId, evals]) => {
        const proposal = data.proposals.find((p) => p.id === proposalId);
        const consensus: Partial<Record<EvaluationCriterionKey, number>> = {};
        for (const key of EVALUATION_MATRIX.map((c) => c.key)) {
          const vals = evals
            .map((e) => e.scores[key])
            .filter((v): v is number => typeof v === "number");
          if (vals.length > 0) {
            consensus[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
          }
        }
        const weighted = computeWeightedScore(consensus);
        const rec = weighted != null ? recommendationFromScore(weighted) : undefined;
        return (
          <Card key={proposalId}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{proposal?.title}</p>
                <p className="text-xs text-slate-500">
                  {proposal?.challenge_title} · {evals.length} evaluator(s)
                </p>
              </div>
              {rec && <Tag tone={rec.includes("reject") ? "danger" : "success"}>{humanise(rec)}</Tag>}
            </div>
            <div className="mt-3">
              <CriterionBars scores={consensus} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">Panel weighted score</span>
              <ScoreChip value={weighted} count={evals.length} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
