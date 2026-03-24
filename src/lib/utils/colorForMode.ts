import type { Leg } from "@/types/route";

export function colorForLeg(leg: Leg): string {
  switch (leg.type) {
    case "cycling":
      return "#16a34a"; // green-600
    case "transit":
      return leg.lineColor || "#3b82f6"; // blue-500 fallback
    case "walking":
      return "#60a5fa"; // blue-400
  }
}

export function strokeWeightForLeg(leg: Leg, isHovered: boolean): number {
  return isHovered ? 8 : 5;
}
