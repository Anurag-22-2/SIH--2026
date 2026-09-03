import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovPilot OS · MSINS Innovation Pilot Platform",
  description:
    "Outcome-based civic innovation pilot platform for the Maharashtra State Innovation Society: challenge formulation, DPIIT startup proposals, independent expert evaluation, milestone-linked payments and GeM scale-up.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
