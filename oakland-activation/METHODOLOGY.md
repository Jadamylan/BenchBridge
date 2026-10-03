# BenchBridge methodology

BenchBridge is a voluntary, opt-in, aggregate decision-support map. It connects candidate rehabilitation demand to the skilled-labor ecosystem. It does not dispatch workers, certify buildings, or take a position on labor agreements.

## Public vs Demo vs Partner Required

**PUBLIC.** Alameda County parcel attributes (APN, situs, use code, land value, improvement value, assessed value) where a cached join matched. Oakland City-owned parcel polygons. Oakland 2023–2031 Housing Element sites inventory attributes: situs, APN, year built, floor area, existing unit count, zoning code, use description, projected capacity by income category, inventory status, and site type. California DIR prevailing-wage notice (context only; dollar rates are not copied). Cached context statistics with a source URL.

**DEMO.** Modeled rehabilitation tasks, worker counts, worker-hours, costs, identified funds, funding gaps, candidate potential units, primary modeled blockers, hypothetical scenarios, and the demo workforce bench. Illustrative contractor cards use synthetic `DEMO-` license numbers. They are not CSLB records.

**PARTNER DATA REQUIRED.** Real union out-of-work availability. Union dispatch. Building inspections. Current owner disposition. Professional environmental assessments. Contractor bids. Project-specific financing. Permit workflow. City resident-registry aggregates. Apprentice share and Oakland-resident share.

Parcel attributes do not establish vacancy, habitability, asbestos, conversion feasibility, ownership availability, or suitability for any particular housing program. Housing Element sites are **official housing planning sites**. They are not approved housing and not “approved homeless housing.”

Building year is never treated as evidence of asbestos. The product displays `Asbestos: UNKNOWN` and `Professional inspection required.`

## Policy Context — not endorsement

These items are public context. BenchBridge does not endorse or oppose them.

- Alameda County’s Measure A1 housing bond is paired with a negotiated project labor agreement for new affordable construction, with an 80-unit threshold for covered projects. Source: County Measure A1 / PLA reporting. Confirm the operative agreement text before relying on the threshold.
- Oakland’s Local Employment Program requires contractors on City-funded construction to hire local residents. The City’s Department of Workplace and Employment Standards keeps a database of local residents seeking construction work. BenchBridge does not have access to that database.
- The Oakland Army Base project labor agreement set a 20% apprentice-hour requirement, with at least half of apprentices required to be Oakland residents.
- In 2024, Oakland debated tying Measure U ($850 million authorization, of which $350 million is for affordable housing — SPUR voter guide) to a project labor agreement. Opponents, including City housing staff and the National Association of Minority Contractors, raised concerns about cost, unit counts, and Black workforce participation. The Council backed a tempered “goal of” version and the sponsors then withdrew the proposal. **Verify current status.** Status after late 2024 is unverified. A “40 percent fewer units” claim is not displayed because it is not verified here.
- San Leandro’s Community Workforce Agreement includes no-strike labor peace, still allows non-union bidders, and accepted documented good-faith use of hiring-hall procedures when local-hire goals were missed.

BenchBridge takes no position on labor agreements. Any agreement is negotiated between public agencies, contractors, and the trades.

## WHY A LOCAL MIGHT OPT IN — HYPOTHESES TO VALIDATE, NOT CLAIMS

1. **Hours:** Hours worked feed health, pension, and apprenticeship contributions. *(General industry structure — confirm with each local.)*
2. **Work they don't see today:** Rehab bundles are small and multi-trade, and PLAs are generally considered a poor fit for small, short-term projects. A bundled rehab program might clear a program-level threshold that single buildings would not.
3. **Proof for the local-hire conversation:** Aggregate referral/placement data helps locals show performance — only if they choose to share it.
4. **Control stays with the local:** Opt-in, aggregate, revocable, dispatch rules untouched.

## Pathways

Concept for discussion. Not a proposal, not legal advice, not an endorsement.

1. **Tier 1 — Voluntary data sharing:** locals opt in to aggregate bench counts by trade.
2. **Tier 2 — First-notice convention:** for City/County-funded rehab, contractors receive trade-demand signals and are encouraged to use existing hiring-hall referral processes before outside hiring. Conditions would attach to funding and contractors, not to unions.
3. **Tier 3 — Optional program-level agreement:** a bundled rehab portfolio could be considered for a program-level community workforce agreement, in the way other jurisdictions have set dollar thresholds for covered projects.

BenchBridge takes no position on labor agreements. Any agreement is negotiated between public agencies, contractors, and the trades.

## Data contract and suppression

A participating union, hiring hall, or the Alameda County Building and Construction Trades Council (only if its affiliates asked it to) could publish:

```
trade, classification (journey | apprentice | all), count or null, suppressed, as_of, source_id, source_status
```

`SUPPRESSION_MIN = 5`. Any aggregate cell whose true count is 1, 2, 3, or 4 is serialized as `count: null`, `suppressed: true`, and displayed as `<5`. The true small count is not sent on the publication endpoint.

No worker names, addresses, demographics, or personal information are in the schema.

Participation metrics render only when a partner provider supplies them. The demo provider supplies none. The screen says “Partner data required.”

The one statistic BenchBridge cannot show is the real number of union workers currently out of work in Alameda County. Real bench counts require partner authorization.

The demo crew illustration for the featured building uses the fictional seed, including a specialist gap of −1, so the arithmetic of a shortage can be shown. The Bench Board publication endpoint still suppresses that cell. A real partner feed would not send the underlying small count, and a production total that could be used to reverse a suppressed cell would be withheld with the cell.

## Wage requirements

Where a public-works scenario may apply, the product states: prevailing wage and labor requirements may apply, and project-specific requirements must be verified. BenchBridge is not a tool for paying below applicable wage requirements.

## Scenario rule for a $500,000 rehabilitation budget

Consider candidates whose primary blocker is a modeled funding gap. Sort by modeled gap per potential unit, ascending, then by property id. Fund each project’s full remaining gap while the cumulative total is within budget. Stop at the first project that does not fit. Affected means the modeled funding gap is fully covered. Non-funding blockers are not resolved. Inspection, owner disposition, and bids remain unknown.

## What the map does not decide

The map does not score a “best” property. It shows address, planning capacity, modeled units, work packages, trades, a demo bench comparison, a modeled blocker, and the public record that placed the parcel in the cache.
