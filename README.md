# BenchBridge

### A skills-first bridge between union dispatches.

BenchBridge started with a problem I kept hearing around the trades: **what happens to a skilled worker’s income between dispatches?**

A worker can have real experience, certifications, transferable skills, and a strong union pathway — and still spend time piecing together where the next opportunity is coming from.

BenchBridge explores a different approach: model the worker, the skills, the programs, the job signals, and the requirements as a graph so the next move is easier to see.

---

## The idea

Traditional job search starts with a title.

BenchBridge starts with the worker.

```text
Worker
  ├── experience
  ├── skills
  ├── certifications
  └── location
        ↓
   graph matching
        ↓
Programs · employers · openings · project signals · requirement gaps
        ↓
A clearer next move
```

The goal is not to promise somebody a job.

The goal is to surface **realistic pathways** and be transparent about why something is showing up.

---

## Oakland activation demo

This branch adds a second arm: a presenter-ready Oakland map. It connects candidate rehabilitation buildings, the modeled work those buildings would take, and a clearly labeled demo bench. It does not replace union dispatch.

From `oakland-activation`:

```bash
make demo
```

The API is http://127.0.0.1:8000. Judge mode is http://127.0.0.1:3010/demo.

---

## What is in this repo

This repository contains a public-safe starter data pack for an SF + Alameda prototype.

Snapshot date: **2026-09-12**

It includes:

- one public-safe demo worker profile
- experience records
- certification records
- evidence-backed skills
- transparent match examples
- organizations and programs
- events
- job / project-demand signals
- source records
- graph edges
- Neo4j constraints + seed scripts

---

## Start here

- `data/benchbridge_seed.json` — all-in-one seed for a prototype API, TypeScript, Python, or Supabase
- `data/von_public_safe_profile.json` — public-safe demo worker
- `data/*.csv` — normalized tables for spreadsheets, Postgres, or data frames
- `neo4j/constraints.cypher` — graph uniqueness constraints
- `neo4j/seed.cypher` — idempotent graph seed
- `cursor_prompt.md` — MVP implementation brief
- `CURSOR_UPDATE_VON.md` — shell-update / handoff prompt

---

## Product rules

The matching logic is intentionally conservative.

### A program existing does not mean applications are open
Registration and intake status are different facts.

### Expired opportunities should disappear by default
Old rows remain in the seed as freshness regression tests, not recommendations.

### Ambiguous leads stay ambiguous
Statuses like `verify_open` and `contact_program` mean exactly that: somebody still needs to verify the opportunity.

### A project signal is not a job
Construction demand can be useful context without being presented as a guaranteed opening.

### Evidence stays attached
Records keep a source and `verified_as_of` value so a future interface can show why the record exists and how fresh it is.

### Eligibility should never be overstated
Strong pathway matches, transferable-skill matches, future-demand signals, and requirement gaps are different things.

### Applicant privacy comes first
The public demo does not contain contact information, raw resumes, addresses, or sensitive applicant details.

---

## Why a graph?

A worker does not map neatly to one job title.

A graph makes it easier to represent relationships like:

```text
(worker)-[:HAS_SKILL]->(skill)
(worker)-[:HOLDS]->(certification)
(program)-[:REQUIRES]->(certification)
(job)-[:NEEDS]->(skill)
(organization)-[:OFFERS]->(program)
```

That makes questions like these much more natural:

- Which opportunities match the skills I already have?
- Which ones are one certification away?
- What programs connect to the work I want next?
- What upcoming project signals suggest demand may be growing?
- Why did this match show up?

---

## Neo4j

Run `neo4j/seed.cypher` in Neo4j Browser or `cypher-shell`.

The seed uses `MERGE`, so reruns update keyed nodes rather than creating duplicates.

Example:

```cypher
MATCH (o:Organization)-[r]->(p:Program)
WHERE p.county IN ['San Francisco','Alameda','Regional']
RETURN o.name, type(r), p.name, p.application_status, p.next_date
ORDER BY p.next_date;
```

---

## Refresh strategy

The data is designed around different verification cadences:

- **Daily:** fast-changing job boards and bid signals
- **Weekly:** apprenticeship openings, workforce programs, construction opportunities
- **Monthly:** directories and slower-changing program references
- **Manual / link-only:** sources where authentication, terms, or PII make automation inappropriate

---

## Important limitation

This is a researched prototype seed, **not a perpetual live feed**.

Dates, openings, eligibility rules, and application windows change. A production version should re-check canonical sources and clearly mark stale records.

---

## Why I built it

I am interested in products that make opportunity easier to navigate for people who already have real skills but are forced to stitch the system together themselves.

BenchBridge is an experiment in what happens when workforce matching is less about keyword search and more about **skills, evidence, relationships, and the next realistic step**.
