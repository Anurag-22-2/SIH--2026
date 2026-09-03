"use client";

import * as React from "react";
import { Badge, Button, Dialog, Field } from "./ui";
import { signContractWithOtp } from "@/lib/api";
import type { PilotAgreement } from "@/lib/types";

export function ContractSigningModal({
  agreement,
  onClose,
  onSigned,
}: {
  agreement: PilotAgreement;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [step, setStep] = React.useState<"review" | "otp" | "success">("review");
  const [otp, setOtp] = React.useState("123456");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSign() {
    if (!acceptedTerms) {
      setError("You must read and accept the IP rights, data privacy, and risk management clauses.");
      return;
    }
    setStep("otp");
    setError(null);
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signContractWithOtp(agreement.id, otp);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP.");
      setBusy(false);
    }
  }

  return (
    <Dialog open title="E-Sign Pilot Agreement & Legal Clauses" onClose={onClose}>
      <div className="space-y-4">
        {step === "review" && (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{agreement.reference_no}</h4>
                  <p className="text-xs text-slate-500">Government-Startup Pilot Agreement</p>
                </div>
                <Badge variant="secondary">DPIIT / MSINS Compliant</Badge>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">IP Rights Ownership:</span>
                  <span className="font-semibold text-slate-900">
                    {agreement.ip_ownership === "startup_owned_govt_licence"
                      ? "Startup Owned (Govt Royalty-Free Licence)"
                      : agreement.ip_ownership}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data Classification:</span>
                  <span className="font-semibold text-slate-900">{agreement.data_classification}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data Residency:</span>
                  <span className="font-semibold text-slate-900">
                    {agreement.data_residency_in_india ? "Mandatory within India (MeitY Cloud)" : "Standard"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data Retention:</span>
                  <span className="font-semibold text-slate-900">{agreement.data_retention_months} Months</span>
                </div>
              </div>

              <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                <p className="font-semibold mb-1">Cybersecurity & Risk Controls:</p>
                <p>• CERT-In cybersecurity guidelines strictly enforced.</p>
                <p>• Milestone-linked payments with 15-day verification SLA.</p>
                <p>• Fast-track procurement / GeM scale-up pathway option upon successful KPI delivery.</p>
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                I have reviewed and agree to the IP Rights, Data Privacy, Cybersecurity, and Risk Management clauses of this pilot contract on behalf of our company.
              </span>
            </label>

            {error && (
              <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSign} disabled={!acceptedTerms}>
                Proceed to E-Sign (OTP)
              </Button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2 text-xs text-blue-900">
              <p className="font-semibold text-sm">Verify Authorized Signatory via OTP</p>
              <p>A 6-digit OTP has been sent to the registered Mobile / Aadhaar number of the Company Director / Founder.</p>
              <p className="text-slate-500 text-[11px]">(Simulated for hackathon demonstration — enter 123456 or any 6 digits)</p>
            </div>

            {error && (
              <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <Field label="Enter 6-Digit OTP">
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-center text-lg font-mono tracking-widest focus:border-slate-900 focus:outline-none"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep("review")} disabled={busy}>
                Back
              </Button>
              <Button size="sm" onClick={handleVerifyOtp} disabled={busy}>
                {busy ? "Verifying..." : "Verify & Digital Sign"}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-base font-semibold text-slate-900">Contract Digitally Signed!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your signature has been registered with Digital Certificate & Timestamp. The department has been notified to countersign and execute the pilot work order.
            </p>
            <div className="pt-2">
              <Button size="sm" onClick={() => { onSigned(); onClose(); }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
