"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { AutocompletePrediction, PlaceInput } from "@/types/route";

interface PlaceAutocompleteProps {
  placeholder: string;
  value: PlaceInput | null;
  onChange: (place: PlaceInput | null) => void;
  disabled?: boolean;
}

export function PlaceAutocomplete({
  placeholder,
  value,
  onChange,
  disabled,
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.description ?? "");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setInputValue("");
    else setInputValue(value.description);
  }, [value]);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/autocomplete?input=${encodeURIComponent(input)}&sessiontoken=${sessionToken.current}`
      );
      const data = await res.json();
      setPredictions(data.predictions ?? []);
    } catch {
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(null); // clear selection when typing
    setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const selectPrediction = async (prediction: AutocompletePrediction) => {
    setInputValue(prediction.description);
    setIsOpen(false);
    setPredictions([]);

    // Geocode the selected place to get coordinates
    try {
      const res = await fetch(
        `/api/geocode?placeId=${encodeURIComponent(prediction.placeId)}`
      );
      const data = await res.json();
      if (data.location) {
        onChange({
          placeId: prediction.placeId,
          description: prediction.description,
          location: data.location,
        });
        // Rotate session token after a successful place selection
        sessionToken.current = crypto.randomUUID();
      }
    } catch {
      // Geocoding failed — clear selection
      onChange(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        )}
        {value && !isLoading && (
          <button
            onClick={() => { onChange(null); setInputValue(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  selectPrediction(p);
                }}
              >
                <span className="font-medium text-gray-900">{p.mainText}</span>
                {p.secondaryText && (
                  <span className="ml-1 text-gray-500 text-xs">
                    {p.secondaryText}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
