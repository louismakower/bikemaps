"use client";

import type { Leg } from "@/types/route";
import { formatDuration } from "@/lib/utils/formatDuration";

interface LegItemProps {
  leg: Leg;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

const MODE_ICONS: Record<string, string> = {
  cycling: "🚴",
  transit: "🚇",
  walking: "🚶",
};

export function LegItem({ leg, isHovered, onHover }: LegItemProps) {
  const icon = MODE_ICONS[leg.type] ?? "•";

  return (
    <li
      className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-default ${
        isHovered ? "bg-green-50" : "hover:bg-gray-50"
      }`}
      onMouseEnter={() => onHover(leg.id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        {leg.type === "cycling" && (
          <>
            <p className="font-medium text-gray-900">
              Cycle to {leg.to}
            </p>
            <p className="text-gray-500 text-xs">
              {(leg.distanceMeters / 1000).toFixed(1)} km
            </p>
          </>
        )}
        {leg.type === "transit" && (
          <>
            <p className="font-medium text-gray-900 flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: leg.lineColor }}
              />
              {leg.line}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {leg.boardingStop} → {leg.alightingStop}
              {leg.numStops > 0 && (
                <> · {leg.numStops} stop{leg.numStops !== 1 ? "s" : ""}</>
              )}
            </p>
            {leg.departureTime && (
              <p className="text-gray-400 text-xs">{leg.departureTime}</p>
            )}
          </>
        )}
        {leg.type === "walking" && (
          <>
            <p className="font-medium text-gray-900">Walk to {leg.to}</p>
            <p className="text-gray-500 text-xs">
              {(leg.distanceMeters / 1000).toFixed(1)} km
            </p>
          </>
        )}
      </div>
      <span className="text-gray-500 text-xs shrink-0 mt-0.5">
        {formatDuration(leg.durationMinutes)}
      </span>
    </li>
  );
}
