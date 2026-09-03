"use client";

import * as React from "react";
import { Button, Dialog, Field, Textarea } from "./ui";
import { createChallenge } from "@/lib/api";
import type { Sector } from "@/lib/types";

const SECTORS: Sector[] = ["PWD", "Urban Waste", "Water Quality"];

export function NewChallengeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [form, setForm] = React.useState({
    title: "",
    problem_statement: "",
    sector: "PWD" as Sector,
    budget_min: "500000",
    budget_max: "5000000",
    target_kpi: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<{
    title: string;
    statement: string;
    outcomes: string[];
    categories: string[];
    kpis: string[];
    duration: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function analyzeProblem() {
    const problem = form.problem_statement.trim();
    if (!problem) {
      setError("Describe the operational problem before running AI analysis.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    window.setTimeout(() => {
      const title = form.title.trim() || "AI-enabled public service workflow";
      const lower = problem.toLowerCase();
      const domain = lower.includes("hospital") || lower.includes("patient")
        ? "healthcare access"
        : lower.includes("waste") || lower.includes("collection")
          ? "waste collection"
          : "public service delivery";
      const outcomes = [
        `Reduce delays and manual effort in ${domain}`,
        "Improve service visibility for officers and citizens",
        "Create measurable evidence for a scalable pilot",
      ];
      const kpis = ["Average service time", "Cases processed per hour", "Error rate", "Staff time saved"];
      setAnalysis({
        title,
        statement: `${problem} The pilot should test a measurable digital intervention that improves ${domain} outcomes while remaining secure, accessible and scalable.`,
        outcomes,
        categories: ["Workflow digitisation", "Data-informed operations", "Citizen experience", "Secure integrations"],
        kpis,
        duration: "90 days",
      });
      setForm((current) => ({
        ...current,
        title: current.title.trim() || title,
        target_kpi: current.target_kpi.trim() || kpis.join("; "),
      }));
      setAnalyzing(false);
    }, 500);
  }

  async function submit() {
    if (!form.title.trim() || !form.problem_statement.trim() || !form.target_kpi.trim()) {
      setError("Complete all fields before creating the challenge.");
      return;
    }
    const min = Number(form.budget_min);
    const max = Number(form.budget_max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
      setError("Budget range must use two amounts, for example 500000-5000000.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createChallenge({
        title: form.title.trim(),
        sector: form.sector,
        department: "Maharashtra State Innovation Society",
        district: "Mumbai",
        problem_statement: form.problem_statement.trim(),
        outcome_metric: form.target_kpi.trim(),
        expected_impact: form.target_kpi.trim(),
        pilot_budget_min: min,
        pilot_budget_max: max,
        programme: "MSINS Innovation Challenge",
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create challenge.");
      setBusy(false);
    }
  }

  return (
    <Dialog open title="New challenge" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <Field label="Challenge title">
          <input className="kilo-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Problem statement">
          <Textarea value={form.problem_statement} onChange={(value) => setForm({ ...form, problem_statement: value })} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-violet-200 bg-violet-50 p-3">
          <div>
            <p className="text-xs font-semibold text-violet-900">Privacy-first AI challenge structuring</p>
            <p className="mt-1 text-xs text-violet-700">Turn an operational description into an editable challenge draft.</p>
          </div>
          <Button size="sm" variant="outline" onClick={analyzeProblem} disabled={analyzing}>
            {analyzing ? "Analyzing…" : "AI analyze problem"}
          </Button>
        </div>
        {analysis && (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">AI-generated draft · review before publishing</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">Recommendation</span>
            </div>
            <p><span className="font-medium text-slate-600">Structured statement:</span> {analysis.statement}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="font-medium text-slate-600">Desired outcomes</p><ul className="mt-1 list-disc pl-4">{analysis.outcomes.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><p className="font-medium text-slate-600">Suggested KPIs</p><ul className="mt-1 list-disc pl-4">{analysis.kpis.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <p><span className="font-medium text-slate-600">Solution categories:</span> {analysis.categories.join(" · ")} · <span className="font-medium text-slate-600">Pilot:</span> {analysis.duration}</p>
          </div>
        )}
        <Field label="Sector">
          <select className="kilo-input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value as Sector })}>
            {SECTORS.map((sector) => <option key={sector}>{sector}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget minimum (₹)">
            <input type="number" min="0" className="kilo-input" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
          </Field>
          <Field label="Budget maximum (₹)">
            <input type="number" min="0" className="kilo-input" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
          </Field>
        </div>
        <Field label="Target KPI">
          <Textarea value={form.target_kpi} onChange={(value) => setForm({ ...form, target_kpi: value })} />
        </Field>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create challenge"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
