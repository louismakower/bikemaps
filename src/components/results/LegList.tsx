"use client";

import type { Leg } from "@/types/route";
import { LegItem } from "./LegItem";

interface LegListProps {
  legs: Leg[];
  hoveredLegId: string | null;
  onHoverLeg: (id: string | null) => void;
}

export function LegList({ legs, hoveredLegId, onHoverLeg }: LegListProps) {
  if (legs.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-gray-400 text-center">
        No route details available
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {legs.map((leg) => (
        <LegItem
          key={leg.id}
          leg={leg}
          isHovered={hoveredLegId === leg.id}
          onHover={onHoverLeg}
        />
      ))}
    </ul>
  );
}
