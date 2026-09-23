"use client";

import * as React from "react";
import Link from "next/link";
import { AuthCard } from "./auth-card";
import { Alert, Button, Field, Input } from "./ui";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

const ROLE_OPTIONS: { value: Role; label: string; caption: string }[] = [
  {
    value: "government",
    label: "Government Officer",
    caption: "Formulate challenges, track pilots, measure KPIs",
  },
  {
    value: "startup",
    label: "Startup",
    caption: "Discover challenges, submit proposals, track payments",
  },
  {
    value: "expert",
    label: "Expert Evaluator",
    caption: "Independent scoring panel",
  },
];

/** Sign-up page with email, password, full name and role selection. */
export function Signup() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("startup");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function validate(): string | null {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        organization: organization.trim() || undefined,
      });
      // Successful sign-up lands in the dashboard via the (auth) layout guard.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Register to participate in outcome-based civic innovation pilots."
      footer={
        <>
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert variant="destructive">{error}</Alert>}

        <Field label="Full name" required>
          <Input
            type="text"
            name="full_name"
            autoComplete="name"
            placeholder="Priya Sharma"
            value={fullName}
            onChange={setFullName}
            required
          />
        </Field>

        <Field
          label="Organization"
          hint="Department, startup or institution you represent."
        >
          <Input
            type="text"
            name="organization"
            autoComplete="organization"
            placeholder="Ministry of Digital Affairs"
            value={organization}
            onChange={setOrganization}
          />
        </Field>

        <Field label="Email" required>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@organisation.gov.in"
            value={email}
            onChange={setEmail}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required hint="Minimum 8 characters.">
            <Input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
            />
          </Field>

          <Field label="Confirm password" required>
            <Input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
          </Field>
        </div>

        <Field label="I am registering as" required>
          <div className="grid gap-2" role="radiogroup" aria-label="Role">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50"
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-0.5 h-4 w-4 accent-slate-900"
                />
                <span>
                  <span className="block font-medium text-slate-900">
                    {option.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {option.caption}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default Signup;
