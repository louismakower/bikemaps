export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLngBounds {
  northeast: LatLng;
  southwest: LatLng;
}

// ---- Legs ----

export interface CyclingLeg {
  type: "cycling";
  id: string;
  durationMinutes: number;
  distanceMeters: number;
  polylinePoints: LatLng[];
  from: string;
  to: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

export interface TransitLeg {
  type: "transit";
  id: string;
  durationMinutes: number;
  distanceMeters: number;
  polylinePoints: LatLng[];
  line: string;
  lineColor: string;
  boardingStop: string;
  alightingStop: string;
  numStops: number;
  departureTime: string;
  arrivalTime: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

export interface WalkingLeg {
  type: "walking";
  id: string;
  durationMinutes: number;
  distanceMeters: number;
  polylinePoints: LatLng[];
  from: string;
  to: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

export type Leg = CyclingLeg | TransitLeg | WalkingLeg;

// ---- Route options ----

export type RouteLabel = "fastest" | "cheapest" | "best_value" | "baseline";

export interface RouteOption {
  label?: RouteLabel;
  legs: Leg[];
  totalTimeMinutes: number;
  farePence: number;
  cyclingDistanceMeters: number;
  timeSavedVsBaseline: number; // negative = faster than baseline
  moneySavedVsBaseline: number; // negative = cheaper than baseline
  bounds: LatLngBounds;
  boardingStation: TflStation;
  alightingStation: TflStation;
}

// ---- TfL types ----

export interface TflStation {
  id: string; // e.g. "940GZZLURMD"
  name: string;
  location: LatLng;
  modes: string[];
}

// ---- API request/response shapes ----

export interface PlaceInput {
  placeId: string;
  description: string;
  location: LatLng;
}

export interface RouteSearchRequest {
  origin: PlaceInput;
  destination: PlaceInput;
}

export interface RouteSearchResponse {
  baseline: RouteOption;
  paretoOptions: RouteOption[];
}

// ---- Autocomplete ----

export interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

// ---- Internal candidate type (before Pareto filtering) ----

export interface RouteCandidate {
  boardingStation: TflStation;
  alightingStation: TflStation;
  cycleToBoarding: { durationMinutes: number; distanceMeters: number };
  cycleFromAlighting: { durationMinutes: number; distanceMeters: number };
  transitDurationMinutes: number;
  farePence: number;
  totalTimeMinutes: number;
  transitLegs: TransitLeg[];
}
