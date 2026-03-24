# Brompton — Bike + Transit Navigation

Find the fastest *and* cheapest routes across London by combining your folding/portable bike with the tube, overground, and Elizabeth line.

## The Idea

Instead of just walking to the nearest station, Brompton enumerates all stations within cycling range of your origin and destination, then finds the Pareto-optimal combinations — trading off **total journey time** against **fare paid**.

**Example:** Richmond → Imperial College London
- 🚶 Transit only: 45 min, £3.50 (walk Richmond → tube all the way to zone 1)
- 🚴 Optimised: 38 min, £2.10 (cycle to Kew Gardens → District line → Earl's Court → cycle to Imperial)

## Setup

### 1. Install

```bash
npm install
```

### 2. API Keys

Copy the env template and fill in your keys:

```bash
cp .env.example .env.local
```

You need three keys:

| Variable | Where to get it |
|---|---|
| `GOOGLE_SERVER_KEY` | [Google Cloud Console](https://console.cloud.google.com) — enable **Directions API**, **Distance Matrix API**, **Places API** |
| `NEXT_PUBLIC_MAPS_JS_KEY` | Same project — enable **Maps JavaScript API**, restrict to your domain |
| `TFL_APP_KEY` | [TfL API Portal](https://api-portal.tfl.gov.uk/) — free registration, 500 req/min |

### 3. Run

```bash
npm run dev
# → http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Home page
│   └── api/
│       ├── routes/                 # POST — main route search
│       ├── cycling-detail/         # POST — detailed cycling polylines
│       ├── autocomplete/           # GET — Places Autocomplete proxy
│       └── geocode/                # GET — Place Details (lat/lng lookup)
├── components/
│   ├── RouteApp.tsx                # Top-level state owner
│   ├── map/                        # MapContainer, RoutePolylines, StepMarkers
│   ├── search/                     # SearchPanel, PlaceAutocomplete, ValueSlider
│   └── results/                    # RouteOptions, RouteOptionCard, LegList, SavingsBadge
└── lib/
    └── routing/
        ├── findOptimalRoutes.ts    # Core algorithm
        ├── paretoFilter.ts         # Pareto-frontier computation
        ├── findNearbyStations.ts   # TfL StopPoint API
        ├── batchCyclingTimes.ts    # Google Distance Matrix API
        ├── getTransitJourney.ts    # TfL Journey Planner API
        ├── getTransitFare.ts       # TfL FareTo API
        └── getCyclingDetail.ts     # Google Directions API
```

## The Algorithm

1. Find all tube/rail stations within 2.5 km of origin and destination (TfL StopPoint API)
2. Batch-fetch cycling times via Google Distance Matrix API (2 calls total regardless of station count)
3. Prune stations further than 20 min cycling
4. For all viable (boarding, alighting) pairs, fetch transit time and fare in parallel
5. Pareto-filter: discard routes dominated on both time AND cost
6. Label and return: **Fastest**, **Cheapest**, **Best Value** (weighted by your time preference), **Baseline** (transit only)
7. Fetch detailed cycling polylines only for the returned options

## Tests

```bash
npm test
```

## Deploy

```bash
npx vercel
# Set GOOGLE_SERVER_KEY, NEXT_PUBLIC_MAPS_JS_KEY, TFL_APP_KEY in Vercel dashboard
```
