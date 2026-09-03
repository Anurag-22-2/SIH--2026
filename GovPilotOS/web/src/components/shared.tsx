"use client";

import * as React from "react";
import { Badge, Progress, SectionLabel } from "./ui";
import { EVALUATION_MATRIX } from "@/lib/mock-data";
import { kpiAchievement, latestSnapshot } from "@/lib/api";
import { cn, formatNumber, humanise } from "@/lib/utils";
import type {
  EvaluationCriterionKey,
  EvaluationRecommendation,
  Kpi,
  Milestone,
  Sector,
} from "@/lib/types";

/* ------------------------------ Status badges ----------------------------- */

type Tone = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

const STATUS_TONE: Record<string, Tone> = {
  // challenges
  draft: "outline",
  open: "default",
  in_review: "warning",
  piloting: "warning",
  closed: "secondary",
  cancelled: "danger",
  // proposals
  submitted: "outline",
  under_review: "warning",
  shortlisted: "secondary",
  rejected: "danger",
  completed: "success",
  scaled: "success",
  // pilots
  planned: "outline",
  active: "success",
  paused: "warning",
  terminated: "danger",
  // milestones
  pending: "outline",
  in_progress: "warning",
  approved: "success",
  paid: "success",
  // evaluations
  assigned: "outline",
  // agreements
  sent_to_startup: "warning",
  signed_by_startup: "secondary",
  executed: "success",
  // gem
  not_started: "outline",
  category_mapped: "secondary",
  listed: "warning",
  bid_published: "warning",
  contract_awarded: "success",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <Badge variant={STATUS_TONE[status] ?? "secondary"} className={className}>
      {humanise(status)}
    </Badge>
  );
}

const SECTOR_TONE: Record<Sector, string> = {
  PWD: "bg-indigo-100 text-indigo-700",
  "Urban Waste": "bg-amber-100 text-amber-700",
  "Water Quality": "bg-sky-100 text-sky-700",
};

export function SectorBadge({ sector }: { sector?: Sector }) {
  if (!sector) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        SECTOR_TONE[sector],
      )}
    >
      {sector}
    </span>
  );
}

const RECOMMENDATION_TONE: Record<EvaluationRecommendation, Tone> = {
  strongly_accept: "success",
  accept: "success",
  neutral: "warning",
  reject: "danger",
  strongly_reject: "danger",
};

export function RecommendationBadge({ value }: { value?: EvaluationRecommendation }) {
  if (!value) return <span className="text-xs text-slate-400">Not recorded</span>;
  return <Badge variant={RECOMMENDATION_TONE[value]}>{humanise(value)}</Badge>;
}

/* -------------------------------- Scores --------------------------------- */

export function scoreTone(value?: number): string {
  if (value == null) return "text-slate-400";
  if (value >= 4) return "text-emerald-600";
  if (value >= 3) return "text-amber-600";
  return "text-red-600";
}

/** Weighted panel score out of 5. */
export function ScoreChip({
  value,
  count,
  className,
}: {
  value?: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className={cn("text-sm font-semibold", scoreTone(value))}>
        {value != null ? value.toFixed(2) : "—"}
      </span>
      <span className="text-xs text-slate-400">/ 5</span>
      {typeof count === "number" && (
        <span className="ml-1 text-xs text-slate-400">
          ({count} review{count === 1 ? "" : "s"})
        </span>
      )}
    </span>
  );
}

/** Horizontal bars for the six-head evaluation matrix. */
export function CriterionBars({
  scores,
  weights,
  compact,
}: {
  scores?: Partial<Record<EvaluationCriterionKey, number>>;
  weights?: Record<EvaluationCriterionKey, number>;
  compact?: boolean;
}) {
  if (!scores || Object.keys(scores).length === 0) {
    return <p className="text-xs text-slate-400">No panel scores yet.</p>;
  }
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      {EVALUATION_MATRIX.map((c) => {
        const score = scores[c.key];
        if (score == null) return null;
        const pct = (score / c.max_score) * 100;
        return (
          <div key={c.key} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-xs text-slate-500">{c.short_label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full",
                  score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn("w-8 text-right text-xs font-medium", scoreTone(score))}>
              {score.toFixed(1)}
            </span>
            {weights && (
              <span className="w-10 text-right text-xs text-slate-400">
                {Math.round((weights[c.key] ?? 0) * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------- KPI achievement ----------------------------- */

export function AchievementBar({ value }: { value?: number }) {
  if (value == null) {
    return <span className="text-xs text-slate-400">Not reported</span>;
  }
  const tone = value >= 85 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{value}%</span>
    </div>
  );
}

/** One KPI line: target, latest verified reading and achievement. */
export function KpiRow({ kpi }: { kpi: Kpi }) {
  const latest = latestSnapshot(kpi.id);
  const achievement = kpiAchievement(kpi);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{kpi.name}</p>
        <p className="text-xs text-slate-400">
          Baseline {formatNumber(kpi.baseline_value, kpi.unit)} → target{" "}
          {formatNumber(kpi.target_value, kpi.unit)} · {humanise(kpi.direction)} ·{" "}
          {kpi.frequency ? humanise(kpi.frequency) : "as reported"}
        </p>
        {kpi.owner && <p className="mt-0.5 text-xs text-slate-400">Verified by: {kpi.owner}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold">
            {latest?.reported_value != null
              ? formatNumber(latest.reported_value, kpi.unit)
              : (latest?.reported_text ?? "—")}
          </p>
          <p className="text-xs text-slate-400">
            {latest?.period ?? "no reading"}
            {latest && !latest.verified ? " · unverified" : ""}
          </p>
        </div>
        <AchievementBar value={achievement} />
      </div>
    </div>
  );
}

/* --------------------------- Milestone strip ----------------------------- */

const MS_TONE: Record<string, string> = {
  paid: "bg-emerald-500",
  approved: "bg-emerald-400",
  under_review: "bg-amber-400",
  submitted: "bg-amber-500",
  in_progress: "bg-slate-400",
  rejected: "bg-red-500",
  pending: "bg-slate-200",
};

/** Compact tranche timeline for a pilot. */
export function MilestoneStrip({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="text-xs text-slate-400">No milestone schedule recorded.</p>;
  }
  return (
    <div>
      <div className="flex gap-1">
        {milestones.map((m) => (
          <div
            key={m.id}
            title={`M${m.seq} · ${m.title} · ${humanise(m.status)}`}
            className="group relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
          >
            <div className={cn("h-full w-full", MS_TONE[m.status] ?? "bg-slate-200")} />
          </div>
        ))}
      </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>M1 · {humanise(milestones[0]?.status)}</span>
          <span>
            {milestones.filter((m) => m.status === "paid").length} of {milestones.length} tranches paid
          </span>
        </div>
    </div>
  );
}

/* ------------------------------- Progress -------------------------------- */

export function LabelledProgress({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} />
      {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
    </div>
  );
}

/* ------------------------------ Text blocks ------------------------------ */

export function TextBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{text}</p>
    </div>
  );
}

export function Chips({ items }: { items: (string | undefined)[] }) {
  const list = items.filter((i): i is string => Boolean(i));
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
      {list.map((i) => (
        <span key={i} className="rounded bg-slate-100 px-2 py-1">
          {i}
        </span>
      ))}
    </div>
  );
}
