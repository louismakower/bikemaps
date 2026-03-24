"use client";

import { useEffect } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import type { PlaceInput, RouteOption, LatLngBounds } from "@/types/route";
import { RoutePolylines } from "./RoutePolylines";
import { StepMarkers } from "./StepMarkers";

const LONDON_CENTER = { lat: 51.505, lng: -0.09 };
const DEFAULT_ZOOM = 12;

interface MapContainerProps {
  origin: PlaceInput | null;
  destination: PlaceInput | null;
  selectedOption: RouteOption | null;
  hoveredLegId: string | null;
  onHoverLeg: (id: string | null) => void;
}

function MapContents({
  origin,
  destination,
  selectedOption,
  hoveredLegId,
  onHoverLeg,
}: MapContainerProps) {
  const map = useMap();

  // Fit map to route bounds when the selected option changes
  useEffect(() => {
    if (!map || !selectedOption) return;

    const { northeast, southwest } = selectedOption.bounds;
    const bounds = new google.maps.LatLngBounds(
      { lat: southwest.lat, lng: southwest.lng },
      { lat: northeast.lat, lng: northeast.lng }
    );
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [map, selectedOption]);

  return (
    <>
      {origin && destination && selectedOption && (
        <>
          <RoutePolylines
            option={selectedOption}
            hoveredLegId={hoveredLegId}
            onHoverLeg={onHoverLeg}
          />
          <StepMarkers
            origin={origin}
            destination={destination}
            option={selectedOption}
          />
        </>
      )}
    </>
  );
}

export function MapContainer(props: MapContainerProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPS_JS_KEY ?? "";

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={LONDON_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="pennyfarething-map"
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <MapContents {...props} />
      </Map>
    </APIProvider>
  );
}
