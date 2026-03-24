"use client";

import { Marker } from "@vis.gl/react-google-maps";
import type { PlaceInput, RouteOption } from "@/types/route";

interface StepMarkersProps {
  origin: PlaceInput;
  destination: PlaceInput;
  option: RouteOption | null;
}

export function StepMarkers({
  origin,
  destination,
  option,
}: StepMarkersProps) {
  return (
    <>
      {/* Origin pin */}
      <Marker
        position={origin.location}
        title={origin.description}
        label={{ text: "A", color: "white", fontWeight: "bold" }}
      />

      {/* Destination pin */}
      <Marker
        position={destination.location}
        title={destination.description}
        label={{ text: "B", color: "white", fontWeight: "bold" }}
      />

      {/* Boarding and alighting station markers */}
      {option && option.label !== "baseline" && (
        <>
          {option.boardingStation.id !== `${origin.location.lat},${origin.location.lng}` && (
            <Marker
              position={option.boardingStation.location}
              title={`Board: ${option.boardingStation.name}`}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}
          {option.alightingStation.id !==
            `${destination.location.lat},${destination.location.lng}` && (
            <Marker
              position={option.alightingStation.location}
              title={`Alight: ${option.alightingStation.name}`}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}
        </>
      )}
    </>
  );
}
