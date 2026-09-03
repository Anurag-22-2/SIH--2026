"use client";

import * as React from "react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Loading,
  SectionLabel,
  StatCard,
  Tabs,
  Tag,
  Textarea,
} from "./ui";
import { StatusBadge } from "./shared";
import {
  fetchAdminPortal,
  releasePayment,
  reviewMilestone,
  setDpiitVerification,
} from "@/lib/api";
import { formatInrCompact, humanise, initials } from "@/lib/utils";
import type { AdminPortalData, LegalTemplate, Milestone, User } from "@/lib/types";
import { ProcurementScaleUp } from "./procurement-scale-up";

export function AdminConsole() {
  const [data, setData] = React.useState<AdminPortalData | null>(null);
  const [tab, setTab] = React.useState("overview");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setData(await fetchAdminPortal());
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return <Loading label="Loading Platform admin console…" />;

  const pendingReview = data.milestones.filter((m) => m.status === "submitted");
  const approved = data.milestones.filter((m) => m.status === "approved");
  const unverified = data.users.filter((u) => u.role === "startup" && !u.dpiit_verified);
  const toExecute = data.agreements.filter((a) => a.status === "signed_by_startup");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Platform Admin Console</h2>
        <p className="text-sm text-slate-500">
          Milestone approvals, payment release, DPIIT verification, legal templates and the GeM
          scale-up pathway.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Users" value={data.users.length} hint={`${data.users.filter((u) => u.role === "startup").length} startups`} />
        <StatCard label="Milestones to review" value={pendingReview.length} hint="Awaiting decision" />
        <StatCard label="Payments to release" value={approved.length} hint="Approved tranches" />
        <StatCard label="DPIIT unverified" value={unverified.length} hint="Startup entities" />
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "milestones", label: `Milestones (${pendingReview.length + approved.length})` },
          { id: "legal", label: `Legal templates (${data.legalTemplates.length})` },
          { id: "dpiit", label: `DPIIT (${unverified.length})` },
          { id: "procurement", label: "Procurement" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && <OverviewTab data={data} onOpen={(t) => setTab(t)} />}
      {tab === "milestones" && <MilestonesTab data={data} onChanged={refresh} />}
      {tab === "legal" && <LegalTab data={data} />}
      {tab === "dpiit" && <DpiitTab data={data} onChanged={refresh} />}
      {tab === "procurement" && <ProcurementScaleUp />}

      {busy && <Loading label="Working…" />}
    </div>
  );
}

function OverviewTab({ data, onOpen }: { data: AdminPortalData; onOpen: (t: string) => void }) {
  const recent = data.activity.slice(0, 12);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <SectionLabel>Recent activity</SectionLabel>
        <div className="mt-3 space-y-2">
          {recent.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium">{humanise(a.action)}</p>
                <p className="text-xs text-slate-500">{a.details}</p>
              </div>
              <span className="text-xs text-slate-400">{a.user_name}</span>
            </div>
          ))}
          {recent.length === 0 && <EmptyState title="No activity yet" />}
        </div>
      </Card>
      <Card>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="mt-3 space-y-2">
          <button className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onOpen("milestones")}>
            Review milestone evidence →
          </button>
          <button className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onOpen("dpiit")}>
            Verify startup DPIIT status →
          </button>
          <button className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onOpen("procurement")}>
            Manage GeM scale-up →
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Milestones -------------------------------- */

function MilestonesTab({ data, onChanged }: { data: AdminPortalData; onChanged: () => void }) {
  const [filter, setFilter] = React.useState<"review" | "approved" | "all">("review");
  const pilotTitle = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of data.pilots) map[p.id] = p.title ?? p.work_order_no;
    return map;
  }, [data.pilots]);

  const list = data.milestones
    .filter((m) =>
      filter === "review"
        ? m.status === "submitted"
        : filter === "approved"
        ? m.status === "approved"
        : m.status !== "paid",
    )
    .sort((a, b) => a.seq - b.seq);

  if (list.length === 0) {
    return <EmptyState title="Nothing to action" hint="Submitted milestones appear here for review." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["review", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1 text-xs font-medium ${
              filter === f ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f === "review" ? "To review" : f === "approved" ? "Approved" : "All open"}
          </button>
        ))}
      </div>
      {list.map((m) => (
        <MilestoneRow key={m.id} milestone={m} pilotTitle={pilotTitle[m.pilot_id]} onChanged={onChanged} />
      ))}
    </div>
  );
}

function MilestoneRow({
  milestone,
  pilotTitle,
  onChanged,
}: {
  milestone: Milestone;
  pilotTitle?: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [expand, setExpand] = React.useState(false);

  async function act(decision: "approved" | "rejected" | "under_review") {
    setBusy(true);
    await reviewMilestone(milestone.id, decision, note);
    setBusy(false);
    onChanged();
  }
  async function release() {
    setBusy(true);
    await releasePayment(milestone.id);
    setBusy(false);
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              M{milestone.seq} · {milestone.title}
            </span>
            <StatusBadge status={milestone.status} />
          </div>
          <p className="text-xs text-slate-500">
            {pilotTitle} · {formatInrCompact(milestone.amount)} · due{" "}
            {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString("en-IN") : "—"}
          </p>
          {milestone.evidence.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Evidence: {milestone.evidence.map((e) => e.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {milestone.status === "submitted" && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setExpand((v) => !v)}>
                {expand ? "Hide" : "Review"}
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => act("rejected")}>
                Reject
              </Button>
              <Button size="sm" variant="success" disabled={busy} onClick={() => act("approved")}>
                Approve
              </Button>
            </>
          )}
          {milestone.status === "approved" && (
            <Button size="sm" onClick={release} disabled={busy}>
              {busy ? "Releasing…" : "Release payment"}
            </Button>
          )}
        </div>
      </div>
      {expand && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <Field label="Reviewer note">
            <Textarea value={note} onChange={setNote} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => act("under_review")}>
              Hold for more info
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- Legal ------------------------------------ */

function LegalTab({ data }: { data: AdminPortalData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.legalTemplates.map((t) => (
        <LegalCard key={t.id} template={t} />
      ))}
    </div>
  );
}

function LegalCard({ template }: { template: LegalTemplate }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{template.name}</p>
          <p className="font-mono text-xs text-slate-400">{template.code} · v{template.version}</p>
        </div>
        <Tag tone={template.status === "active" ? "success" : "default"}>{template.status}</Tag>
      </div>
      <p className="mt-2 text-xs text-slate-500">{template.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {template.compliance_refs.map((r) => (
          <span key={r} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {r}
          </span>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setOpen(true)}>
        View clauses
      </Button>
      {open && (
        <ClausesDialog template={template} onClose={() => setOpen(false)} />
      )}
    </Card>
  );
}

function ClausesDialog({ template, onClose }: { template: LegalTemplate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{template.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {template.code} · v{template.version} · owner {template.owner}
            </p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {template.clauses.map((c, i) => (
            <div key={i} className="rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.heading}</p>
                {c.mandatory && <Tag tone="danger">Mandatory</Tag>}
              </div>
              <p className="mt-1 text-xs text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- DPIIT ----------------------------------- */

function DpiitTab({ data, onChanged }: { data: AdminPortalData; onChanged: () => void }) {
  const startups = data.users.filter((u) => u.role === "startup");
  const [busy, setBusy] = React.useState<string | null>(null);
  async function toggle(u: User) {
    setBusy(u.id);
    await setDpiitVerification(u.id, !u.dpiit_verified);
    setBusy(null);
    onChanged();
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {startups.map((u) => (
        <Card key={u.id}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(u.full_name)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{u.organization ?? u.full_name}</p>
              <p className="text-xs text-slate-500">
                DPIIT {u.dpiit_number ?? "—"} · GSTIN {u.gstin ?? "—"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Tag tone={u.dpiit_verified ? "success" : "danger"}>
              {u.dpiit_verified ? "Verified" : "Unverified"}
            </Tag>
            <Button size="sm" variant={u.dpiit_verified ? "outline" : "success"} disabled={busy === u.id} onClick={() => toggle(u)}>
              {busy === u.id ? "Saving…" : u.dpiit_verified ? "Revoke" : "Verify"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
