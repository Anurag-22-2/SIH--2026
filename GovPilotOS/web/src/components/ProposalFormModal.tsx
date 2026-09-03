"use client";

import * as React from "react";
import { Button, Dialog, Field, Textarea } from "./ui";
import type { Challenge } from "@/lib/types";
import { createProposal } from "@/lib/api";

export interface ProposalFormValues {
  solutionApproach: string;
  budget: number;
  timelineMonths: number;
  trlLevel: number;
}

export function ProposalFormModal({
  challenge,
  open,
  onClose,
  onSubmitted,
}: {
  challenge: Challenge;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [solutionApproach, setSolutionApproach] = React.useState("");
  const [budget, setBudget] = React.useState(2500000);
  const [timelineMonths, setTimelineMonths] = React.useState(3);
  const [trlLevel, setTrlLevel] = React.useState(6);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setSolutionApproach("");
    setBudget(Math.min(challenge.budget_max || 2500000, 2500000));
    setTimelineMonths(Math.max(1, Math.round((challenge.duration_weeks || 12) / 4)));
    setTrlLevel(Math.max(1, Math.min(9, challenge.eligibility?.min_trl || 6)));
    setError(null);
  }, [challenge, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!solutionApproach.trim()) {
      setError("Solution approach is required.");
      return;
    }
    if (budget <= 0 || timelineMonths <= 0) {
      setError("Budget and timeline must be greater than zero.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createProposal({
        challenge_id: challenge.id,
        title: `${challenge.title} proposal`,
        summary: solutionApproach.trim(),
        solution_approach: solutionApproach.trim(),
        budget_estimate: budget,
        timeline_weeks: timelineMonths * 4,
        trl_level: trlLevel,
      });
      onSubmitted();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Proposal submission failed.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={`Apply: ${challenge.title}`}
      description="Submit your solution for government review."
      onClose={onClose}
      width="max-w-2xl"
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Solution approach" required>
          <Textarea
            value={solutionApproach}
            onChange={setSolutionApproach}
            placeholder="Describe your proposed implementation, delivery plan, and expected outcomes."
            rows={6}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Estimated budget (₹)" required>
            <input
              className="kilo-input"
              type="number"
              min={1}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
            />
          </Field>
          <Field label="Timeline (months)" required>
            <input
              className="kilo-input"
              type="number"
              min={1}
              value={timelineMonths}
              onChange={(event) => setTimelineMonths(Number(event.target.value))}
            />
          </Field>
          <Field label="TRL level" required>
            <select
              className="kilo-input"
              value={trlLevel}
              onChange={(event) => setTrlLevel(Number(event.target.value))}
            >
              {Array.from({ length: 9 }, (_, index) => index + 1).map((level) => (
                <option key={level} value={level}>
                  TRL {level}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit proposal"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
