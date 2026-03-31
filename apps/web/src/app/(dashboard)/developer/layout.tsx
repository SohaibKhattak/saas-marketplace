"use client";

import { DeveloperGate } from "@/components/layout/developer-gate";

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
