# Cursor implementation prompt: BenchBridge data ingestion

Build a production-minded local prototype around the files in this directory.

## Goals

- Ingest `data/benchbridge_seed.json` into a typed domain model.
- Support Worker, WorkerExperience, WorkerCertification, WorkerSkill, WorkerMatchExample, Organization, Program, Event, Opportunity and Source entities plus relationships.
- Preserve every source URL, `verified_as_of`, confidence value and status exactly.
- Default user views to San Francisco County and Alameda County, while retaining nearby regional pipelines.

## Required behavior

1. Create strict TypeScript types or equivalent schemas with validation.
2. Normalize semicolon-separated trade categories into arrays at the application boundary.
3. Hide `expired` opportunities from public search unless an admin enables historical records.
4. Render `verify_open`, `contact_program`, `ongoing_verify_details` and `upcoming_verify_details` with a clear “Confirm with provider” action.
5. Never display `project_demand_signal` as a job. Give it a separate “Projects likely to create demand” section.
6. Rank results by: exact county, active/upcoming status, P1 source or organization, verified recency, then date.
7. Add freshness logic from `sources.refresh_cadence`; when overdue, downgrade status to “needs verification” without deleting the record.
8. Link out to applications; do not ingest applicant PII.
9. Add filters for county, city, trade category, program type, status, eligibility and date.
10. Add unit tests using the two intentionally expired SF postings and the EBMUD event with closed registration.
11. Use Von as the only demo worker. Keep his profile in public-safe mode and never add his legal name or contact information.
12. Present matching as four distinct tiers: strong pathway, transferable skills, future demand, and requirements gap.

## Suggested modules

- `src/domain/benchbridge.ts` — schemas and enums.
- `src/data/seed.ts` — loader and validation.
- `src/search/rank.ts` — county/status/priority/freshness scoring.
- `src/connectors/` — one connector per source family, initially stubs with documented cadence.
- `src/privacy/policy.ts` — link-out-only rules and forbidden applicant-form ingestion.
- `src/data/demo-worker.ts` — public-safe Von profile with no direct identifiers.
- `src/search/explain-match.ts` — evidence, requirements gap and next-action copy.

## Neo4j option

If Neo4j is available, run `neo4j/seed.cypher`. Otherwise use the JSON file in memory or seed Postgres/Supabase tables. Keep stable IDs unchanged so future refreshes can upsert.

## Definition of done

- Seed loads with zero validation errors.
- Search can return an upcoming Alameda pathway (Rising Sun or Cypress Mandela), an active SF job (Water Service Inspector), and an SF project demand signal without mixing entity types.
- Stale and registration-closed records are visibly suppressed or warned.
- Admin detail shows source, confidence and verification date.
- Von's demo profile renders without any legal name, phone, email, LinkedIn URL, street address or license number.
- Water Service Inspector and Stationary Engineer appear as requirements-gap examples, not strong matches.
