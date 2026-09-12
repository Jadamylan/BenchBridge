# BenchBridge Build Plan for Qoder

## Current integration scope

The application remains a Vite + React + TypeScript demo shell for profiles, matching, and Bridge Plan actions. The Relationship View now reads Von's public-safe graph projection from a server-only Neo4j API; its browser client calls the relative `/api/graph/von` path and never receives database credentials.

## Neo4j operational flow

1. Set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, and optionally `NEO4J_DATABASE` in a local, uncommitted `.env` file.
2. Apply `neo4j/constraints.cypher` before loading `neo4j/seed.cypher`.
3. Start the client and API together with `npm run dev`.
4. In deployment, route the frontend's relative `/api` path to `server/index.ts` behind the same trusted origin.

The read-only query in `server/neo4j.ts` returns only the one-hop, evidence-backed Von context map and validates the graph shape before it reaches the browser.

## Next implementation phases

### 1. Server-side data integration

- Keep all external source refreshes and future provider integrations behind the backend boundary.
- Preserve source IDs and verification dates on every graph-derived result.
- Validate and normalize external records before they reach repository implementations.

### 2. Grounded assistance

- Implement `AIService` only after the repository data is available to the backend.
- Require every generated suggestion to use source-backed records and keep uncertainty, requirements gaps, freshness, and project-demand distinctions intact.
- Do not describe deterministic scoring as AI and do not let AI output imply eligibility or availability that source data does not establish.

### 3. Consent-aware product expansion

- Add identity, contact, credential-verification, and application workflows only after consent, role-based access, retention, and audit requirements are defined.
- Keep public demos limited to the current public-safe worker projection.

## Acceptance checks for future work

- A worker result is displayed only through a privacy-appropriate projection.
- A source record and verification date can be traced from every rendered recommendation.
- Requirements-gap records are never promoted as ready-to-apply recommendations.
- Project demand remains a workforce signal, not a job application.
- Expired records remain hidden by default and visibly archived when a user requests them.
- Automated tests continue to cover the seed contract, filtering rules, plan provenance, and confirmation labels.
