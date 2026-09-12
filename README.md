# BenchBridge SF + Alameda trades data pack

Snapshot date: **2026-09-12**

This starter pack is built for a Cursor-assisted MVP. It contains one public-safe demo worker (Von), 5 experience records, 8 certification records, 16 evidence-backed skills, 7 transparent match examples, 36 organizations, 18 programs, 11 events, 10 jobs/project signals, 37 ingestion sources, and 86 graph edges.

## Start here

- `data/benchbridge_seed.json` — easiest all-in-one seed for TypeScript, Python, Supabase or a prototype API.
- `data/von_public_safe_profile.json` — focused worker-profile payload for the demo shell.
- `data/*.csv` — normalized tables for spreadsheets, Postgres or data frames.
- `data/workers.csv` and `data/worker_*.csv` — Von's public-safe demo profile, experience, credentials, skills and transparent match examples.
- `neo4j/constraints.cypher` — uniqueness constraints.
- `neo4j/seed.cypher` — idempotent node and relationship seed; no APOC dependency.
- `cursor_prompt.md` — implementation brief to paste into Cursor.
- `CURSOR_UPDATE_VON.md` — the full shell-update and Qoder-handoff prompt.

## Product rules encoded in the data

1. **Program exists is not the same as applications are open.** A DIR-registered apprenticeship is authoritative evidence of registration, not intake status.
2. **Suppress `expired` by default.** Expired rows are intentionally included as regression tests for freshness logic.
3. **Verify ambiguous leads.** Treat `verify_open`, `contact_program`, `ongoing_verify_details`, and `upcoming_verify_details` as call-to-confirm states.
4. **Do not call a bid a job.** `project_demand_signal` records are upstream indicators of contractor/subcontractor demand.
5. **Protect applicant data.** Intake forms are link-outs. Do not scrape form responses or collect PII without clear consent and a defined retention policy.
6. **Keep evidence.** Every record links to a `source_id`; show the source and `verified_as_of` in admin views.
7. **Protect Von's identity.** Use first name only. Never add his phone, email, LinkedIn, street address, legal name, license number or raw resume to a public repository.
8. **Do not overstate eligibility.** Separate strong pathway matches, transferable-skills matches, future-demand signals and requirements gaps.

## Suggested refresh order

1. Daily: SF Careers, SF citywide exams, EBMUD/BART job boards, Tradeswomen jobs/events, SF Public Works bids.
2. Weekly: CTWI apprenticeship openings, Cypress Mandela, Rising Sun, SFO construction opportunities.
3. Monthly: DIR and Building California apprenticeship directories, workforce centers, union directories.
4. Manual/link-only: applicant forms, CalJOBS authenticated results, Craigslist until terms/spam controls are settled.

## Neo4j

Run `neo4j/seed.cypher` in Neo4j Browser or cypher-shell. The seed uses `MERGE`, so reruns update properties without duplicating keyed nodes. Edge types are intentionally literal for compatibility without APOC.

Example query:

```cypher
MATCH (o:Organization)-[r]->(p:Program)
WHERE p.county IN ['San Francisco','Alameda','Regional']
RETURN o.name, type(r), p.name, p.application_status, p.next_date
ORDER BY p.next_date;
```

## Important limitation

This is a researched seed, not a perpetual live feed. Dates and openings can change quickly; the connector layer should re-check canonical pages and mark stale records when `verified_as_of` ages past the source cadence.
