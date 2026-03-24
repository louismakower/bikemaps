"use client";

import type { RouteOption, RouteLabel } from "@/types/route";
import { RouteOptionCard } from "./RouteOptionCard";
import { LegList } from "./LegList";

interface RouteOptionsProps {
  options: RouteOption[];
  selectedLabel: RouteLabel;
  hoveredLegId: string | null;
  onSelectOption: (label: RouteLabel) => void;
  onHoverLeg: (id: string | null) => void;
}

export function RouteOptions({
  options,
  selectedLabel,
  hoveredLegId,
  onSelectOption,
  onHoverLeg,
}: RouteOptionsProps) {
  const selectedOption = options.find((o) => o.label === selectedLabel);

  return (
    <div className="flex flex-col gap-3">
      {/* Option cards */}
      <div className="grid grid-cols-1 gap-2 px-4">
        {options.map((option) => (
          <RouteOptionCard
            key={option.label}
            option={option}
            isSelected={option.label === selectedLabel}
            onSelect={() => onSelectOption(option.label)}
          />
        ))}
      </div>

      {/* Leg breakdown for selected option */}
      {selectedOption && (
        <div>
          <h3 className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Route breakdown
          </h3>
          <LegList
            legs={selectedOption.legs}
            hoveredLegId={hoveredLegId}
            onHoverLeg={onHoverLeg}
          />
        </div>
      )}
    </div>
  );
}
