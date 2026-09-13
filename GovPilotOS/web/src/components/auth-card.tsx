"use client";

import * as React from "react";
import { Badge } from "./ui";

/**
 * Shared centered card shell for the auth pages: brand header on top, the
 * form card in the middle, and an optional footer line under the card.
 * The page background stays plain so the card reads as the focal point.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white">
          GP
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              GovPilot OS
            </h1>
            <Badge variant="secondary">MSINS</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Maharashtra State Innovation Society
          </p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {children}
      </div>

      {footer ? (
        <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}
