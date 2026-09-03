import { pilotKpiAchievement } from "./api";
import type { DashboardData, Kpi, Milestone, Pilot, ScaleDecision } from "./types";

export type RiskLevel = "low" | "medium" | "high";
export type ScaleReadiness = "ready" | "in_progress" | "not_ready";

export interface PilotView {
  pilot: Pilot;
  milestones: Milestone[];
  kpis: Kpi[];
  milestonesPaid: number;
  kpiAchievementAvg?: number;
  riskLevel: RiskLevel;
  scaleReadiness: ScaleReadiness;
}

export function groupByPilot<T extends { pilot_id?: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, it) => {
    const key = it.pilot_id ?? "";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
}

function computeRisk(pilot: Pilot, milestones: Milestone[], kpiAvg?: number): RiskLevel {
  if (pilot.budget_spent > pilot.budget_allocated) return "high";
  if (milestones.some((m) => m.status === "rejected")) return "medium";
  if (kpiAvg == null) return "low";
  if (kpiAvg < 50) return "high";
  if (kpiAvg < 75) return "medium";
  return "low";
}

function computeReadiness(
  pilot: Pilot,
  decision: ScaleDecision | undefined,
  kpiAvg?: number,
): ScaleReadiness {
  if (decision) {
    if (decision.decision === "gem_procurement") return "ready";
    if (decision.decision === "scale_pilot") return "in_progress";
    return "not_ready";
  }
  if (pilot.status === "completed") {
    if (kpiAvg != null && kpiAvg >= 80) return "ready";
    return "in_progress";
  }
  return "not_ready";
}

export function buildPilotViews(data: DashboardData): PilotView[] {
  const milestonesByPilot = groupByPilot(data.milestones);
  const kpisByPilot = groupByPilot(data.kpis);
  const scaleByPilot = groupByPilot(data.scaleDecisions);

  return data.pilots.map((pilot) => {
    const milestones = milestonesByPilot[pilot.id] ?? [];
    const kpis = (kpisByPilot[pilot.id] ?? []).sort((a, b) => (a.id > b.id ? 1 : -1));
    const kpiAchievementAvg = pilotKpiAchievement(pilot.id);
    const decision = scaleByPilot[pilot.id]?.[0];
    return {
      pilot,
      milestones: milestones.sort((a, b) => a.seq - b.seq),
      kpis,
      milestonesPaid: milestones.filter((m) => m.status === "paid").length,
      kpiAchievementAvg,
      riskLevel: computeRisk(pilot, milestones, kpiAchievementAvg),
      scaleReadiness: computeReadiness(pilot, decision, kpiAchievementAvg),
    };
  });
}
