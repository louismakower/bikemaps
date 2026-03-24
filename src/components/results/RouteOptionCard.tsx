"use client";

import type { RouteOption, RouteLabel } from "@/types/route";
import { formatDuration } from "@/lib/utils/formatDuration";
import { formatPence } from "@/lib/utils/formatCurrency";
import { SavingsBadge } from "./SavingsBadge";

interface RouteOptionCardProps {
  option: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}

const LABEL_TEXT: Record<RouteLabel, string> = {
  fastest: "Fastest",
  cheapest: "Cheapest",
  best_value: "Best Value",
  baseline: "Transit Only",
};

export function RouteOptionCard({
  option,
  isSelected,
  onSelect,
}: RouteOptionCardProps) {
  const cyclingKm = (option.cyclingDistanceMeters / 1000).toFixed(1);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
        isSelected
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${
              isSelected ? "text-green-700" : "text-gray-500"
            }`}
          >
            {LABEL_TEXT[option.label]}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-gray-900">
              {formatDuration(option.totalTimeMinutes)}
            </span>
            {option.farePence > 0 && (
              <span className="text-sm text-gray-600">
                · {formatPence(option.farePence)}
              </span>
            )}
          </div>
          {option.cyclingDistanceMeters > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              🚴 {cyclingKm} km cycling
            </p>
          )}
        </div>
        {isSelected && (
          <span className="text-green-600 text-lg mt-0.5">✓</span>
        )}
      </div>

      <div className="mt-2">
        <SavingsBadge option={option} />
      </div>
    </button>
  );
}
