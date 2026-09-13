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

/**
 * Sign-in page. `role` is a hint for which demo identity to fall back to when
 * the API is unreachable — the server itself resolves the role from the
 * account's email.
 */
export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("government");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password, role);
      // Successful sign-in lands in the dashboard via the (auth) layout guard.
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
      title="Sign in"
      description="Access your GovPilot OS workspace."
      footer={
        <>
          New to the platform?{" "}
          <Link
            href="/signup"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert variant="destructive">{error}</Alert>}

        <Field label="Official email" required>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@gov.in"
            value={email}
            onChange={setEmail}
            required
          />
        </Field>

        <Field label="Password" required>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            required
          />
        </Field>

        <Field label="Signing in as" required>
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
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default Login;
