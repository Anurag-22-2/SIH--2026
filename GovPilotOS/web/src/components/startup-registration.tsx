"use client";

import * as React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  Field,
  SectionLabel,
  Textarea,
} from "./ui";
import { StatusBadge } from "./shared";
import { DISTRICTS, SECTORS, MSINS_PROGRAMMES } from "@/lib/mock-data";
import { registerStartup } from "@/lib/api";
import { formatInrCompact, formatCurrency } from "@/lib/utils";
import type { User } from "@/lib/types";

export interface StartupRegistrationProps {
  onRegistered?: (user: User) => void;
  defaultValues?: Partial<RegistrationFormValues>;
}

export interface RegistrationFormValues {
  full_name: string;
  organization: string;
  email: string;
  phone: string;
  designation: string;
  sector: string;
  district: string;
  dpiit_number: string;
  dpiit_valid_till: string;
  cin: string;
  gstin: string;
  incorporation_year: string;
  team_size: string;
  udyam_number: string;
  msins_programme: string;
  profit_loss_period: string;
  annual_turnover: string;
  annual_profit_loss: string;
  financial_doc_url: string;
  bio: string;
  accepted_clauses: boolean;
}

const DEFAULT_VALUES: RegistrationFormValues = {
  full_name: "",
  organization: "",
  email: "",
  phone: "",
  designation: "Founder & CEO",
  sector: "PWD",
  district: "Mumbai",
  dpiit_number: "",
  dpiit_valid_till: "",
  cin: "",
  gstin: "",
  incorporation_year: String(new Date().getFullYear()),
  team_size: "",
  udyam_number: "",
  msins_programme: "",
  profit_loss_period: "",
  annual_turnover: "",
  annual_profit_loss: "",
  financial_doc_url: "",
  bio: "",
  accepted_clauses: false,
};

export function StartupRegistration({ onRegistered, defaultValues }: StartupRegistrationProps) {
  const [form, setForm] = React.useState<RegistrationFormValues>({ ...DEFAULT_VALUES, ...defaultValues });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [registered, setRegistered] = React.useState<User | null>(null);

  function set<K extends keyof RegistrationFormValues>(key: K, value: RegistrationFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function numberInput(key: keyof RegistrationFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value);
  }

  async function submit() {
    if (!form.full_name || !form.organization || !form.email) {
      setErr("Founder name, company name and email are required.");
      return;
    }
    if (!form.dpiit_number) {
      setErr("DPIIT recognition number is required for MSINS funding eligibility.");
      return;
    }
    if (!form.cin) {
      setErr("CIN (Company Identification Number) is required.");
      return;
    }
    if (!form.accepted_clauses) {
      setErr("You must accept the data-handling and IP clauses to register.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const user = await registerStartup({
        email: form.email,
        full_name: form.full_name,
        organization: form.organization,
        phone: form.phone || undefined,
        designation: form.designation,
        department: "Startup",
        district: form.district,
        sectors: form.sector as any,
        dpiit_number: form.dpiit_number,
        dpiit_verified: false,
        dpiit_valid_till: form.dpiit_valid_till || undefined,
        cin: form.cin,
        gstin: form.gstin || undefined,
        incorporation_year: form.incorporation_year ? Number(form.incorporation_year) : undefined,
        team_size: form.team_size ? Number(form.team_size) : undefined,
        udyam_number: form.udyam_number || undefined,
        msins_programme: form.msins_programme || undefined,
        profit_loss_period: form.profit_loss_period || undefined,
        annual_turnover: form.annual_turnover ? Number(form.annual_turnover) : undefined,
        annual_profit_loss: form.annual_profit_loss ? Number(form.annual_profit_loss) : undefined,
        financial_doc_url: form.financial_doc_url || undefined,
      });
      setRegistered(user);
      onRegistered?.(user);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setForm({ ...DEFAULT_VALUES, ...defaultValues });
    setRegistered(null);
    setErr(null);
  }

  if (registered) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h3 className="mt-4 text-lg font-semibold">Registration successful</h3>
          <p className="mt-2 text-sm text-slate-600">
            Welcome, {registered.full_name}. Your DPIIT number is seeded as <strong>unverified</strong>;
            the Platform Admin will verify it before you can submit pilot funding proposals.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Entity</span>
              <span className="font-medium">{registered.organization ?? registered.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DPIIT</span>
              <span className="font-medium">{registered.dpiit_number ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CIN</span>
              <span className="font-medium">{registered.cin ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual turnover</span>
              <span className="font-medium">{formatInrCompact(registered.annual_turnover)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Profit / Loss</span>
              <span className={`font-medium ${
                (registered.annual_profit_loss ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                {formatCurrency(registered.annual_profit_loss)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={registered.dpiit_verified ? "verified" : "pending_verification"} />
            </div>
          </div>
          <Button className="mt-6" variant="outline" onClick={reset}>
            Register another startup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardContent className="p-6">
        <SectionLabel>Startup Registration</SectionLabel>
        <p className="mt-1 text-sm text-slate-500">
          Register your DPIIT-recognised startup. Capture your CIN, company details and the latest
          Profit/Loss statement so the platform can assess eligibility for MSINS pilot funding.
        </p>

        {!form.dpiit_valid_till && (
          <Alert className="mt-3" variant="default">
            DPIIT recognition must be valid. The Platform Admin will verify your DPIIT number after
            registration before you can apply to challenges.
          </Alert>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" hint="Authorized representative">
            <input
              className="kilo-input"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Smt. Anjali Desai"
            />
          </Field>
          <Field label="Company / Organization" required>
            <input
              className="kilo-input"
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="InnovateTech Solutions Pvt Ltd"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className="kilo-input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="founder@company.com"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              className="kilo-input"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98XXXXXX99"
            />
          </Field>
          <Field label="Designation">
            <input
              className="kilo-input"
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
            />
          </Field>
          <Field label="Sector">
            <select
              className="kilo-input"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="District">
            <select
              className="kilo-input"
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="MSINS Programme">
            <select
              className="kilo-input"
              value={form.msins_programme}
              onChange={(e) => set("msins_programme", e.target.value)}
            >
              <option value="">Select a programme</option>
              {MSINS_PROGRAMMES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="Unlisted / other">Unlisted / other</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <SectionLabel>Company registration (DPIIT / MCA / GST)</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="DPIIT recognition number" hint="From DPIIT startup portal" required>
              <input
                className="kilo-input"
                value={form.dpiit_number}
                onChange={(e) => set("dpiit_number", e.target.value)}
                placeholder="e.g. DPIIT/2024/0110945"
              />
            </Field>
            <Field label="DPIIT valid till">
              <input
                type="date"
                className="kilo-input"
                value={form.dpiit_valid_till}
                onChange={(e) => set("dpiit_valid_till", e.target.value)}
              />
            </Field>
            <Field label="CIN (Company Identification Number)" required>
              <input
                className="kilo-input"
                value={form.cin}
                onChange={(e) => set("cin", e.target.value)}
                placeholder="U62099MH2022PTC381204"
              />
            </Field>
            <Field label="GSTIN">
              <input
                className="kilo-input"
                value={form.gstin}
                onChange={(e) => set("gstin", e.target.value)}
                placeholder="27AAKCA9021L1ZP"
              />
            </Field>
            <Field label="Incorporation year">
              <input
                type="number"
                className="kilo-input"
                value={form.incorporation_year}
                onChange={(e) => set("incorporation_year", e.target.value)}
                min={1990}
                max={new Date().getFullYear()}
              />
            </Field>
            <Field label="Team size">
              <input
                type="number"
                className="kilo-input"
                value={form.team_size}
                onChange={(e) => set("team_size", e.target.value)}
                placeholder="e.g. 18"
                min={1}
              />
            </Field>
          </div>

          <Field label="Udyam / MSME registration number">
            <input
              className="kilo-input"
              value={form.udyam_number}
              onChange={(e) => set("udyam_number", e.target.value)}
              placeholder="UDYAM-MH-19-0114872"
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <SectionLabel>Financial details — Profit / Loss</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Financial year period">
              <input
                className="kilo-input"
                value={form.profit_loss_period}
                onChange={(e) => set("profit_loss_period", e.target.value)}
                placeholder="e.g. FY 2025-26"
              />
            </Field>
            <Field label="Annual turnover (₹)">
              <input
                type="number"
                className="kilo-input"
                value={form.annual_turnover}
                onChange={(e) => set("annual_turnover", e.target.value)}
                placeholder="e.g. 2400000"
              />
            </Field>
            <Field label="Annual profit / loss (₹)">
              <input
                type="number"
                className="kilo-input"
                value={form.annual_profit_loss}
                onChange={(e) => set("annual_profit_loss", e.target.value)}
                placeholder="Positive = profit, negative = loss"
              />
            </Field>
            <Field label="Team description / Bio">
              <Textarea
                value={form.bio}
                onChange={(v) => set("bio", v)}
                placeholder="Brief company overview and track record (2-3 lines)"
              />
            </Field>
          </div>
          <Field label="Financial document (balance sheet / P&L URL)">
            <input
              className="kilo-input"
              value={form.financial_doc_url}
              onChange={(e) => set("financial_doc_url", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <p className="mt-1 text-xs text-slate-500">
            Link to the published annual report, balance sheet or P&L statement. This supports
            scalability scoring under the cost-efficiency criterion.
          </p>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.accepted_clauses}
              onChange={(e) => set("accepted_clauses", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>
              I confirm that the above details are accurate and accept the MSINS data-handling,
              IP-ownership and outcome-based payment clauses. DPIIT verification will be reviewed by
              the Platform Admin before funding eligibility is granted.
            </span>
          </label>
        </div>

        {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={reset} disabled={busy}>
            Reset
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Registering…" : "Complete registration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StartupRegistrationDialog({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered?: (user: User) => void;
}) {
  if (!open) return null;
  return (
    <Dialog
      open
      title="Startup Registration"
      description="Capture DPIIT, CIN and financial details to unlock MSINS pilot funding."
      onClose={onClose}
      width="max-w-4xl"
    >
      <StartupRegistration onRegistered={(u) => { onRegistered?.(u); onClose(); }} />
    </Dialog>
  );
}
