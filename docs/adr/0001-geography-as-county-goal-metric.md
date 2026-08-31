# Participants Geography table groups by County and is goal-tracked

The participants page Geography card groups respondents by **County** (rolled up
from zip codes) instead of listing raw zip codes, and gains `Goal` / `To goal`
columns like the demographic tables. We store these targets as a new recruitment
metric named `county` in comhairle's `recruitment_targets` (bucket = county name),
reusing the existing Modify-Goals flow rather than inventing a parallel store.

## Considered Options

- **Rows = Subregion (Bend, Redmond, Sisters)** — matches the source spreadsheet's
  grain and shows finer recruitment gaps, but there is no subregion data model and
  target floors would fragment. Rejected: the approved design shows Counties.
- **Rows = County** — chosen. County is the coarsest unit that still exposes
  under-recruited areas, and a national zip→county dataset already exists.
- **Curated per-region focus-county list** vs **derive from `zipPrefixes`** — chose
  to derive. A region's zips are already scoped to its state by the same
  `zipPrefixes` mechanism that redirects users (`getRegionByZipcode`: `97`→Oregon,
  `84`→Utah), so no new curated artifact is needed. The generic/`all` region (empty
  prefixes → whole US) falls back to only counties with participants or a goal.
- **Backend-computed `countyCounts`** vs **frontend rollup** — chose a frontend
  rollup done **server-side** in `participants/+page.server.ts`, keeping the change
  in this repo (no comhairle dependency) while keeping the ~169k-line zip dataset
  out of the client bundle.

## Consequences

- The national zip→county lookup moves from `packages/civicos/src/lib/data/zipcodes.ts`
  into `@civicos/shared` (exposed as `zipToCounty(zip)`), so both `ZipInput` and the
  admin rollup share one source.
- Geography goals live in the same `recruitment_targets` table as demographic goals,
  under `metric = 'county'`; reversing means cleaning up those rows.
- When the Region data model is built (CONTEXT.md Open Problem #1), the interim
  frontend zip→county lookup should move server-side with the rest of region config.
