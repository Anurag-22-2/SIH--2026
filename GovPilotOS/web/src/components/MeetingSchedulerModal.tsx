"use client";

import * as React from "react";
import { Button, Dialog, Field, Textarea } from "./ui";
import { scheduleMeeting } from "@/lib/api";

export function MeetingSchedulerModal({
  pilotId,
  pilotTitle,
  onClose,
  onScheduled,
}: {
  pilotId: string;
  pilotTitle?: string;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [form, setForm] = React.useState({
    title: `Alignment Meeting — ${pilotTitle || "Pilot"}`,
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    attendees: "Officer, Startup Founder, Expert Evaluator",
    agenda: "Review pilot milestones, data access requirements, and deployment site readiness.",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    if (!form.title.trim() || !form.agenda.trim()) {
      setError("Title and agenda are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await scheduleMeeting({
        pilot_id: pilotId,
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        attendees: form.attendees.split(",").map((s) => s.trim()).filter(Boolean),
        agenda: form.agenda.trim(),
        status: "scheduled",
      });
      onScheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting.");
      setBusy(false);
    }
  }

  return (
    <Dialog open title="Schedule Manual Meeting" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Set up an alignment meeting between departmental officers, startup team, and independent evaluators.
        </p>

        {error && (
          <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <Field label="Meeting Title">
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Technical Alignment & Site Visit Review"
          />
        </Field>

        <Field label="Date & Time">
          <input
            type="datetime-local"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>

        <Field label="Attendees (comma separated)">
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            value={form.attendees}
            onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            placeholder="Officer, Startup Lead, Expert Evaluator"
          />
        </Field>

        <Field label="Agenda">
          <Textarea
            rows={3}
            value={form.agenda}
            onChange={(val) => setForm({ ...form, agenda: val })}
            placeholder="Outline discussion topics..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={busy}>
            {busy ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
