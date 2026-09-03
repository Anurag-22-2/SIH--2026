"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Card --------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-tight tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-slate-500", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
  );
}

/* --------------------------------- Button -------------------------------- */

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "destructive"
  | "secondary"
  | "success"
  | "danger";
type ButtonSize = "default" | "sm" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/* --------------------------------- Badge --------------------------------- */

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-700",
  outline: "border border-slate-300 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Tabs --------------------------------- */

export function Tabs({
  tabs,
  value,
  onValueChange,
  active,
  onChange,
  className,
}: {
  tabs: ({ value?: string; id?: string; label: string; count?: number })[];
  value?: string;
  onValueChange?: (v: string) => void;
  active?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  const current = active ?? value ?? tabs[0]?.id ?? tabs[0]?.value ?? "";
  const set = onChange ?? onValueChange ?? (() => {});
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 border-b border-slate-200",
        className,
      )}
    >
      {tabs.map((t) => {
        const key = t.id ?? t.value ?? "";
        return (
          <button
            key={key}
            onClick={() => set(key)}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              current === key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Skeleton ------------------------------- */

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}

/* --------------------------------- Alert --------------------------------- */

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
      role="alert"
      {...props}
    />
  );
}

/* -------------------------------- Progress ------------------------------- */

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div
        className="h-full rounded-full bg-slate-900 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* --------------------------------- Select -------------------------------- */

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

/* ---------------------------------- Input -------------------------------- */

export const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    onChange?: (value: string) => void;
  }
>(({ className, onChange, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900",
      className,
    )}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
    onChange?: (value: string) => void;
  }
>(({ className, onChange, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900",
      className,
    )}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* --------------------------------- Field --------------------------------- */

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="flex items-baseline gap-1 text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/* --------------------------------- Stat ---------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={cn("mt-1 text-3xl font-semibold tracking-tight", toneClass)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Dialog --------------------------------- */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
  width,
}: {
  open?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  width?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <div
        className={cn(
          "relative w-full rounded-lg border border-slate-200 bg-white shadow-xl",
          width ?? (wide ? "max-w-4xl" : "max-w-2xl"),
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Stepper -------------------------------- */

export type StepState = "complete" | "current" | "upcoming" | "blocked";

export function Stepper({
  steps,
  className,
}: {
  steps: { label: string; caption?: string; state: StepState }[];
  className?: string;
}) {
  const dot: Record<StepState, string> = {
    complete: "bg-emerald-500 text-white",
    current: "bg-slate-900 text-white ring-4 ring-slate-200",
    upcoming: "bg-slate-200 text-slate-500",
    blocked: "bg-red-500 text-white",
  };
  return (
    <ol className={cn("flex flex-col gap-3 sm:flex-row sm:items-start", className)}>
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-1 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              dot[s.state],
            )}
          >
            {s.state === "complete" ? "✓" : i + 1}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block text-sm font-medium",
                s.state === "upcoming" ? "text-slate-400" : "text-slate-900",
              )}
            >
              {s.label}
            </span>
            {s.caption && <span className="block text-xs text-slate-400">{s.caption}</span>}
          </span>
          {i < steps.length - 1 && (
            <span className="mt-3 hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------ Score input ------------------------------ */

/** 1-5 segmented score selector used by the evaluation matrix. */
export function ScoreInput({
  value,
  onChange,
  max = 5,
  disabled,
}: {
  value?: number;
  onChange: (v: number) => void;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
      {Array.from({ length: max }).map((_, i) => {
        const score = i + 1;
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            aria-label={`Score ${score}`}
            className={cn(
              "h-8 w-9 border-r border-slate-200 text-sm font-medium transition-colors last:border-r-0 disabled:opacity-50",
              active
                ? score >= 4
                  ? "bg-emerald-600 text-white"
                  : score === 3
                    ? "bg-amber-500 text-white"
                    : "bg-red-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Table --------------------------------- */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("whitespace-nowrap py-2 pr-4 text-xs font-medium uppercase tracking-wide text-slate-400", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("py-3 pr-4 align-top", className)}>{children}</td>;
}

export function EmptyState({
  title,
  description,
  hint,
  className,
}: {
  title: string;
  description?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-slate-200 py-10 text-center", className)}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {(description ?? hint) && (
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">{description ?? hint}</p>
      )}
    </div>
  );
}

/* ------------------------------ Info blocks ------------------------------ */

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>
  );
}

/* ---------------------------------- Tag ---------------------------------- */

export type TagTone =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

const tagTones: Record<TagTone, string> = {
  default: "bg-slate-100 text-slate-600",
  secondary: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: TagTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        tagTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Loading -------------------------------- */

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      {label}
    </div>
  );
}

