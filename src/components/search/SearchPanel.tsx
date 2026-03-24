"use client";

import { Spinner } from "@/components/ui/Spinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PlaceAutocomplete } from "./PlaceAutocomplete";
import type { PlaceInput } from "@/types/route";

interface SearchPanelProps {
  origin: PlaceInput | null;
  destination: PlaceInput | null;
  isLoading: boolean;
  error: string | null;
  onOriginChange: (place: PlaceInput | null) => void;
  onDestinationChange: (place: PlaceInput | null) => void;
  onSearch: () => void;
  onErrorDismiss: () => void;
}

export function SearchPanel({
  origin,
  destination,
  isLoading,
  error,
  onOriginChange,
  onDestinationChange,
  onSearch,
  onErrorDismiss,
}: SearchPanelProps) {
  const canSearch = !!origin && !!destination && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSearch) onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      {/* Origin */}
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-lg shrink-0" title="Origin">
          ●
        </span>
        <PlaceAutocomplete
          placeholder="From..."
          value={origin}
          onChange={onOriginChange}
          disabled={isLoading}
        />
      </div>

      {/* Destination */}
      <div className="flex items-center gap-2">
        <span className="text-red-500 text-lg shrink-0" title="Destination">
          ▼
        </span>
        <PlaceAutocomplete
          placeholder="To..."
          value={destination}
          onChange={onDestinationChange}
          disabled={isLoading}
        />
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={onErrorDismiss} />
      )}

      <button
        type="submit"
        disabled={!canSearch}
        className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4 text-white" />
            Finding routes…
          </>
        ) : (
          "Get routes"
        )}
      </button>
    </form>
  );
}
