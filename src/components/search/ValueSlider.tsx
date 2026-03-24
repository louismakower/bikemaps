"use client";

interface ValueSliderProps {
  value: number; // pence per minute
  onChange: (value: number) => void;
}

const PRESETS = [
  { ppm: 5, label: "£3/hr" },
  { ppm: 10, label: "£6/hr" },
  { ppm: 17, label: "£10/hr" },
  { ppm: 25, label: "£15/hr" },
];

export function ValueSlider({ value, onChange }: ValueSliderProps) {
  const currentLabel =
    PRESETS.find((p) => p.ppm === value)?.label ?? `${value}p/min`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Value of time</span>
        <span className="font-medium text-gray-700">{currentLabel}</span>
      </div>
      <input
        type="range"
        min={5}
        max={33}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-gray-200 accent-green-600 cursor-pointer"
        title="How much do you value 1 minute of time (in pence)?"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Value money</span>
        <span>Value time</span>
      </div>
    </div>
  );
}
