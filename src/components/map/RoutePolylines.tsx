"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
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
  const map = useMap();
  // Map from leg id → google.maps.Polyline instance
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());

  // Create / update polylines whenever legs or hovered state changes
  useEffect(() => {
    if (!map) return;

    const existing = polylinesRef.current;
    const nextIds = new Set(option.legs.map((l) => l.id));

    // Remove polylines for legs that are no longer in this option
    existing.forEach((polyline, id) => {
      if (!nextIds.has(id)) {
        polyline.setMap(null);
        existing.delete(id);
      }
    });

    // Create or update each leg
    option.legs.forEach((leg) => {
      if (leg.polylinePoints.length < 2) return;

      const isHovered = hoveredLegId === leg.id;
      const isWalking = leg.type === "walking";
      const path = leg.polylinePoints.map((p) => ({
        lat: p.lat,
        lng: p.lng,
      }));

      const walkColor = colorForLeg(leg);
      const icons = isWalking
        ? [{
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: walkColor,
              fillOpacity: 1,
              strokeColor: walkColor,
              strokeOpacity: 1,
              strokeWeight: 1,
              scale: 2.5,
            },
            offset: "0",
            repeat: "8px",
          }]
        : [];

      if (existing.has(leg.id)) {
        const polyline = existing.get(leg.id)!;
        polyline.setOptions({
          path,
          strokeColor: colorForLeg(leg),
          strokeWeight: isWalking ? 0 : isHovered ? 8 : 5,
          strokeOpacity: isWalking ? 0 : isHovered ? 1 : 0.85,
          icons,
        });
      } else {
        const polyline = new google.maps.Polyline({
          path,
          strokeColor: colorForLeg(leg),
          strokeWeight: isWalking ? 0 : isHovered ? 8 : 5,
          strokeOpacity: isWalking ? 0 : isHovered ? 1 : 0.85,
          icons,
          map,
        });

        polyline.addListener("mouseover", () => onHoverLeg(leg.id));
        polyline.addListener("mouseout", () => onHoverLeg(null));
        polyline.addListener("click", () =>
          onHoverLeg(hoveredLegId === leg.id ? null : leg.id)
        );

        existing.set(leg.id, polyline);
      }
    });

    // Cleanup on unmount or option change clears all
    return () => {
      // Only clean up when the option changes entirely (handled above)
    };
  }, [map, option, hoveredLegId, onHoverLeg]);

  // Clean up all polylines on unmount
  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current.clear();
    };
  }, []);

  return null;
}
