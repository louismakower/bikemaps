"use client";

import { Polyline } from "@vis.gl/react-google-maps";
import type { RouteOption } from "@/types/route";
import { colorForLeg } from "@/lib/utils/colorForMode";

interface RoutePolylinesProps {
  option: RouteOption;
  hoveredLegId: string | null;
  onHoverLeg: (id: string | null) => void;
}

export function RoutePolylines({
  option,
  hoveredLegId,
  onHoverLeg,
}: RoutePolylinesProps) {
  return (
    <>
      {option.legs.map((leg) => {
        const isHovered = hoveredLegId === leg.id;
        if (leg.polylinePoints.length < 2) return null;

        return (
          <Polyline
            key={leg.id}
            path={leg.polylinePoints}
            strokeColor={colorForLeg(leg)}
            strokeWeight={isHovered ? 8 : 5}
            strokeOpacity={isHovered ? 1 : 0.85}
            onClick={() => onHoverLeg(isHovered ? null : leg.id)}
            onMouseover={() => onHoverLeg(leg.id)}
            onMouseout={() => onHoverLeg(null)}
          />
        );
      })}
    </>
  );
}
