# BenchBridge Qoder Handoff

## Run the demo

```bash
cp .env.example .env
# Set the Neo4j connection values in .env; never commit this file.
npm install
npm run dev
```

Apply `neo4j/constraints.cypher` and then `neo4j/seed.cypher` to the configured database before opening the Relationship View. The client and server start together; the relationship graph is unavailable until server-only Neo4j configuration is present.

## Quality checks

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## Architecture boundaries

- `src/data/seed.ts` validates the local seed before it reaches the UI and projects the limited `PublicWorker` shape.
- `src/data/repositories/localRepositories.ts` implements fixture repositories for local matching, profiles, and tests.
- `src/services/localServices.ts` creates deterministic, evidence-backed match explanations and Bridge Plan actions.
- `src/adapters/api/ApiGraphRepository.ts` reads the Relationship View graph through the relative server API path.
- `server/neo4j.ts` owns the Neo4j driver, environment-based configuration, and read-only graph query.
- `server/index.ts` exposes only the fixed Von graph and health endpoints; database credentials never enter the browser bundle.
- `src/adapters/ai/AIServiceAdapter.ts` is the future grounded AI integration boundary; it intentionally throws until Qoder connects a safe implementation.

## Privacy and recommendation rules

- The only demo worker is `WORKER-DEMO-001` (Von), projected as `public_safe`.
- Never add legal identity, contact information, street address, credential numbers, raw resume text, or a raw resume file.
- Preferred counties are local browser-only search settings, never a residence claim. Keep `home_county` as `not_provided`.
- Keep requirements-gap records out of Best Matches, Recommended for You, Ready to Apply, and Apply Now surfaces.
- Keep project-demand signals distinct from individual jobs or application actions.
- Keep Cypress Mandela as completed training history, not a repeat-program recommendation.
- Retain source, verification, and provider-confirmation language when replacing local data with live integrations.

## Integration next steps

1. Apply the provided Neo4j constraints and seed scripts, then verify `GET /api/graph/von` returns the public-safe graph projection.
2. In deployment, route the frontend's relative `/api` path to the server API; do not expose the API directly to untrusted origins without appropriate controls.
3. Implement a grounded AI adapter that only summarizes repository records, cites source records, and preserves uncertainty labels.
4. Add authenticated user and consent flows only after a privacy and security review.
