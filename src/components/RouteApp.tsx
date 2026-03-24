"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  PlaceInput,
  RouteOption,
  RouteLabel,
  RouteSearchResponse,
} from "@/types/route";
import { SearchPanel } from "./search/SearchPanel";
import { RouteOptions } from "./results/RouteOptions";
import { DEFAULT_PENCE_PER_MINUTE } from "@/lib/routing/constants";

// Map is loaded dynamically to avoid SSR issues with Google Maps
const MapContainer = dynamic(
  () => import("./map/MapContainer").then((m) => m.MapContainer),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
);

type AppStatus = "idle" | "loading" | "success" | "error";

export function RouteApp() {
  const [origin, setOrigin] = useState<PlaceInput | null>(null);
  const [destination, setDestination] = useState<PlaceInput | null>(null);
  const [valuePencePerMinute, setValuePencePerMinute] = useState(DEFAULT_PENCE_PER_MINUTE);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<RouteLabel>("fastest");
  const [hoveredLegId, setHoveredLegId] = useState<string | null>(null);

  const selectedOption =
    routeOptions.find((o) => o.label === selectedLabel) ?? routeOptions[0] ?? null;

  const handleSearch = useCallback(async () => {
    if (!origin || !destination) return;

    setStatus("loading");
    setError(null);
    setRouteOptions([]);

    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, valuePencePerMinute }),
      });

      const data: RouteSearchResponse & { error?: { message: string } } =
        await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message ?? "Failed to find routes");
      }

      if (data.options.length === 0) {
        throw new Error("No routes found between these locations");
      }

      setRouteOptions(data.options);
      // Select "fastest" by default, falling back to first option
      const labels = data.options.map((o) => o.label);
      setSelectedLabel(labels.includes("fastest") ? "fastest" : labels[0]);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setStatus("error");
    }
  }, [origin, destination, valuePencePerMinute]);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-y-auto">
        <SearchPanel
          origin={origin}
          destination={destination}
          valuePencePerMinute={valuePencePerMinute}
          isLoading={status === "loading"}
          error={error}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onValueChange={setValuePencePerMinute}
          onSearch={handleSearch}
          onErrorDismiss={() => setError(null)}
        />

        {status === "success" && routeOptions.length > 0 && (
          <>
            <div className="border-t border-gray-100 mx-4" />
            <div className="py-3">
              <RouteOptions
                options={routeOptions}
                selectedLabel={selectedLabel}
                hoveredLegId={hoveredLegId}
                onSelectOption={setSelectedLabel}
                onHoverLeg={setHoveredLegId}
              />
            </div>
          </>
        )}

        {status === "loading" && (
          <div className="px-4 py-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 space-y-2 animate-pulse">
                <div className="h-3 w-20 rounded bg-gray-200" />
                <div className="h-6 w-32 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          origin={origin}
          destination={destination}
          selectedOption={selectedOption}
          hoveredLegId={hoveredLegId}
          onHoverLeg={setHoveredLegId}
        />
      </div>
    </div>
  );
}
