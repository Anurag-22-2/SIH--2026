"use client";

import * as React from "react";
import { Badge, Button, Dialog } from "./ui";
import { formatInrCompact } from "@/lib/utils";
import type { User } from "@/lib/types";

export function StartupDetailModal({
  startup,
  onClose,
}: {
  startup: User | any;
  onClose: () => void;
}) {
  const trl = startup.trlLevel ?? startup.trl_level ?? 8;
  const dpiit = startup.dpiitNumber ?? startup.dpiit_number ?? "DPIIT Recognized";
  const verified = startup.dpiitVerified ?? startup.dpiit_verified ?? true;
  const turnover = startup.annualTurnover ?? startup.annual_turnover ?? startup.financials?.lastYearTurnover ?? "₹1.5 Cr";
  const teamSize = startup.teamSize ?? startup.team_size ?? 18;

  return (
    <Dialog open title={`Startup Profile — ${startup.name || startup.organization || startup.full_name}`} onClose={onClose}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
        {/* Header */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{startup.name || startup.organization || startup.full_name}</h3>
              <p className="text-xs text-slate-500">{startup.legalName || startup.organization || "Private Limited Startup"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={verified ? "success" : "warning"}>
                {verified ? `✅ DPIIT (${dpiit})` : "DPIIT Pending"}
              </Badge>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                TRL Level {trl} / 9
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-700">{startup.summary || startup.bio || "Innovative deep-tech startup building solutions for public sector & civic challenges."}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-slate-600">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Sector</span>
              <span className="font-medium text-slate-800">{startup.sector || startup.sectors?.[0] || "DeepTech"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Team Size</span>
              <span className="font-medium text-slate-800">{teamSize} members</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Annual Turnover</span>
              <span className="font-medium text-slate-800">{typeof turnover === "number" ? formatInrCompact(turnover) : turnover}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Headquarters</span>
              <span className="font-medium text-slate-800">{startup.headquarters || startup.district || "Maharashtra"}</span>
            </div>
          </div>
        </div>

        {/* GFR Exemption Eligibility */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 text-sm font-bold">⚡ GFR Fast-Track Procurement Eligible</span>
          </div>
          <p className="text-emerald-900 text-[11px]">
            Qualifies for direct pilot sanction up to ₹50 Lakh under Rule 170(i) of General Financial Rules for DPIIT-recognised startups with TRL 8-9 without prior turnover/experience barriers.
          </p>
        </div>

        {/* Tech Stack & Patents */}
        {startup.techStack && Array.isArray(startup.techStack) && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-800">Tech Stack & Core Competencies:</span>
            <div className="flex flex-wrap gap-1.5">
              {startup.techStack.map((tech: string, i: number) => (
                <span key={i} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Past Government Projects */}
        {startup.pastGovtProjects && Array.isArray(startup.pastGovtProjects) && startup.pastGovtProjects.length > 0 && (
          <div className="space-y-2">
            <span className="font-semibold text-slate-800">Past Government Projects & Deployments:</span>
            <div className="space-y-1.5">
              {startup.pastGovtProjects.map((proj: any, idx: number) => (
                <div key={idx} className="rounded border border-slate-200 bg-white p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{proj.projectName || proj.department}</span>
                    <Badge variant="success">{proj.status}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-600">Department: {proj.department}</p>
                  {proj.kpiAchieved && (
                    <p className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-1 rounded">
                      🎯 Outcome: {proj.kpiAchieved}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
