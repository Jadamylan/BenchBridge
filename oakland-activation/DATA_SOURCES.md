# Data sources

The machine-readable registry is `data/source_registry.yaml`. This note says what was actually cached.

## Integrated from a public API

| Source | Fields kept | Cache |
| --- | --- | --- |
| Alameda County parcels FeatureServer | APN, situs, ZIP, use code, land, improvements, total net value | `data/snapshots/alameda_county_parcels.json` |
| Oakland CityOwnedProperties | APN, street number and name, owner, agency, department, use, city, ZIP, council district, lot size, geometry | `data/snapshots/city_owned_oakland.geojson` |
| Oakland Housing Element opportunity sites | APN, situs, year built, floor area, existing units, zoning, use description, general-plan code, capacity by income band, status, site type, geometry | `data/snapshots/housing_element_buildings.geojson` |
| EDD July 2026 release | Construction jobs 887,400 and year-over-year −6,700; Alameda unemployment 4.6% | `data/processed/context_stats.json` |
| City of Oakland PIT release, May 19, 2026 | 53.8% county share; unsheltered 2,695 (prior 3,659) | same |
| Local News Matters, May 20, 2026 | Oakland 4,410 (prior 5,485); county 8,201 (prior 9,450); unsheltered 5,202 (prior 6,343) | same |
| SPUR Measure U guide | $850M authorization, $350M affordable housing | same |

## Cached, not re-verified (`verified: false`)

- U.S. construction jobs added in 2025 (14,000), industry-group analysis.
- San Francisco Building Trades Council survey figure from 2023 (about 1,200). Precedent only. Not Alameda County.
- Secondary Hoodline housing-award figure. Hidden from Judge Mode and the map strip.

The population-share comparison that sometimes accompanies the 53.8% figure was not in the City release retrieved on 2026-10-03, so it is not shown.

## Manual snapshot or not loaded

- CSLB: search page recorded, no license rows. Demo firms are separate and labeled demo.
- Alameda County qualified-contractor list: not downloaded.
- DIR: notice only. No wage rates copied.
- GeoTracker, CalEnviroScreen, flood, and liquefaction: not downloaded. The environmental layer is an explicit empty state.

## Demo seed

`scripts/candidate_seed.py` holds modeled tasks and the fictional bench. `scripts/build_data.py` recomputes hours, cost, and the funding gap from those tasks. The UI does not contain the headline targets as literals.
