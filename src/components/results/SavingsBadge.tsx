"use client";

import { formatDuration } from "@/lib/utils/formatDuration";
import { formatPence } from "@/lib/utils/formatCurrency";
import type { RouteOption } from "@/types/route";

interface SavingsBadgeProps {
  option: RouteOption;
}

export function SavingsBadge({ option }: SavingsBadgeProps) {
  if (option.label === "baseline") return null;

  const timeSaved = option.timeSavedVsBaseline; // positive = faster
  const moneySaved = option.moneySavedVsBaseline; // positive = cheaper

  if (timeSaved <= 0 && moneySaved <= 0) return null;

  const parts: string[] = [];
  if (timeSaved > 0) parts.push(`${formatDuration(timeSaved)} faster`);
  if (moneySaved > 0) parts.push(`${formatPence(moneySaved)} cheaper`);

  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      ✓ {parts.join(", ")} than transit alone
    </span>
  );
}
