type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (val: ClassValue) => {
    if (!val) return;
    if (typeof val === "string" || typeof val === "number") {
      out.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    } else if (typeof val === "object") {
      for (const key in val) {
        if (val[key]) out.push(key);
      }
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}

/* ------------------------------------------------------------------ */
/* Indian currency & number formatting                                 */
/* ------------------------------------------------------------------ */

/** Full INR amount in the Indian digit grouping, e.g. ₹2,15,00,000. */
export function formatCurrency(value?: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Compact lakh/crore label used across cards and tables.
 * 500000 -> ₹5 L · 21500000 -> ₹2.15 Cr
 */
export function formatInrCompact(value?: number | null): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    return `₹${trimZeros((value / 10_000_000).toFixed(2))} Cr`;
  }
  if (abs >= 100_000) {
    return `₹${trimZeros((value / 100_000).toFixed(2))} L`;
  }
  if (abs >= 1_000) {
    return `₹${trimZeros((value / 1_000).toFixed(1))} K`;
  }
  return `₹${value}`;
}

function trimZeros(s: string): string {
  return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

/** Budget band label, e.g. "₹25 L – ₹50 L". */
export function formatBudgetRange(min?: number, max?: number): string {
  if (min == null && max == null) return "—";
  if (min == null) return `up to ${formatInrCompact(max)}`;
  if (max == null) return `from ${formatInrCompact(min)}`;
  return `${formatInrCompact(min)} – ${formatInrCompact(max)}`;
}

export function formatNumber(value?: number | null, unit?: string): string {
  if (value == null) return "—";
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Days from today until a date; negative when overdue. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function relativeDeadline(value?: string | null): string {
  const days = daysUntil(value);
  if (days == null) return "—";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

/** snake_case / kebab-case to Sentence case. */
export function humanise(value?: string | null): string {
  if (!value) return "—";
  const spaced = value.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .replace(/(Dr\.|Prof\.|Shri\.|Smt\.|Ms\.|Mr\.)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Percentage of target, clamped to a sane display range. */
export function pctOf(value?: number | null, target?: number | null): number | null {
  if (value == null || target == null || target === 0) return null;
  return Math.round((value / target) * 100);
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
