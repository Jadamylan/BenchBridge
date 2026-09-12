# Cursor update prompt: use Von as the BenchBridge demo worker

You are updating my existing BenchBridge repository for a B.E.L.L.E × Qoder × Neo4j hackathon handoff.

Your job is to finish the clickable application shell around the supplied researched data and the public-safe demo worker named **Von**. The completed repository will be handed to Qoder to implement the final Neo4j integration, AI orchestration, connectors and production behavior.

Do not rebuild the project from scratch. Inspect the current framework, routes, components, styling system, package manager and build commands first. Preserve working code and the current design direction. Then make the changes instead of stopping after the audit.

## Data package

Use the files under `data/benchbridge/`:

- `benchbridge_seed.json`
- `workers.csv`
- `worker_experience.csv`
- `worker_certifications.csv`
- `worker_skills.csv`
- `worker_match_examples.csv`
- `organizations.csv`
- `programs.csv`
- `events.csv`
- `opportunities.csv`
- `sources.csv`
- `relationships.csv`
- `data_dictionary.csv`
- `neo4j/constraints.cypher`
- `neo4j/seed.cypher`

Use `benchbridge_seed.json` as the shell's local data source. Do not hard-code researched records inside UI components. Access them through typed repository/service interfaces so Qoder can replace the local implementation with Neo4j.

## Replace the previous demo identity

Search the complete repository case-insensitively for:

- Marcus
- Roger
- Jamal
- placeholder worker names used in the BenchBridge demo

Replace the visible demo worker with **Von** where those names refer to the same sample worker. Update mock responses, fixtures, tests, profile screens, graph labels, saved-state keys, accessibility text and demo copy. Do not rename unrelated people, external records, variables or dependencies.

Use the stable ID `WORKER-DEMO-001`.

## Privacy rules for Von

Von is based on a real person. The repository and public demo must use a minimized profile.

Allowed:

- First name: Von
- Bay Area, California
- Professional summary
- Roles and employers
- Month/year employment dates
- Skills
- Training
- Certification names
- Target roles
- Match evidence and requirements gaps

Forbidden in the repository, UI, tests, screenshots, telemetry and generated demo content:

- Legal name
- Phone number
- Email address
- LinkedIn URL
- Street address
- Driver's-license number
- Certification/card numbers
- Raw resume file or unredacted resume text

Do not infer Von's home county from his phone number, employers or training locations. His `home_county` is `not_provided`. San Francisco and Alameda are demo search preferences, not a claim about residence.

Add a small `Public-safe demo profile` label on his profile and in the admin/debug view. Do not place a distracting privacy warning on every card.

## Von's positioning

Use the supplied data rather than rewriting the resume in UI components.

Von is a field operations, construction, safety, transportation and utility-career candidate with:

- 10+ years of combined experience across union construction support, transit, commercial transportation and U.S. Army motor transportation operations
- Recent Construction Helper experience with UA Local 342
- More than six years as an SFMTA Transit Operator
- Commercial double-deck bus experience
- U.S. Army Motor Transportation Operator experience; Specialist E-4; honorably discharged
- A completed Cypress Mandela 16-week, 640-hour MC3-based Green Construction Pre-Apprenticeship
- Class B CDL with a clean driving record
- OSHA 10 construction safety training
- Confined-space training
- Asbestos-awareness training
- CPR/AED stated as valid through July 2027
- DOT compliance and safety training
- Mechanical and heavy-equipment operations training
- Emergency-response and hazard-identification training

Target-role families:

- Utility field worker
- Field technician
- Construction helper or laborer
- Transportation operations
- Maintenance support
- Safety-sensitive field operations

## Matching behavior

Build a transparent deterministic matcher for the shell. Do not claim the local scoring rules are AI.

Every result must include:

- Match tier
- Match score
- Evidence from Von's profile
- Eligibility state
- Missing or unverified requirements
- Recommended next action
- Source
- `verified_as_of`

Use these four match tiers:

1. `strong_pathway_match`
2. `transferable_skills_match`
3. `future_demand_signal`
4. `requirements_gap`

Do not use one generic percentage without showing the evidence and gap.

### Required examples

Use `worker_match_examples` as regression fixtures:

- Northern California Laborers apprenticeship: strong pathway match
- UA Local 483 Sprinkler Fitters apprenticeship: strong pathway match
- Northern California Surveyors / Operating Engineers pathway: transferable-skills match
- Junior EV-charging Field Technician: transferable-skills match, but verify the employer posting and location
- SF Public Works Turk Street switchboard/HVAC project: future-demand signal, not a job
- SF Water Service Inspector: requirements gap because the posting requires two years of water/wastewater field or distribution operations not shown in the resume
- SF Stationary Engineer: requirements gap because the posting requires four years of journey-level stationary-engineer experience or a qualifying substitute not established by the resume

The two requirements-gap examples must never appear under “Best matches” or “Apply now.” They may appear in a “What you would need” or admin/explainability view.

Von already completed Cypress Mandela. Show that program as training history and a graph relationship, not as a recommendation to repeat the same program.

## Required demo flow

Create one clean judging flow:

1. User opens BenchBridge.
2. User selects “View Von's demo.”
3. Von's dashboard shows that he is between assignments and available for his next opportunity.
4. Dashboard summarizes his readiness: Class B CDL, OSHA 10, construction support, field safety, transportation and MC3 training.
5. User opens “Best Matches.”
6. App separates:
   - Jobs to verify/apply for
   - Apprenticeship and union pathways
   - Workforce support and events
   - Projects likely to create future demand
7. User opens a match and sees exactly why it fits Von, what is missing and what action to take.
8. User opens the relationship view and sees how Von connects to skills, credentials, prior organizations, programs and opportunities.
9. User clicks “Build My Bridge Plan.”
10. The shell generates a local deterministic action plan from the match records. Leave a typed AI-service adapter for Qoder to replace later.

## Required screens

Finish or create the following routes using the project's existing routing conventions.

### Landing page

- BenchBridge value proposition
- “Find My Next Move” primary action
- “View Von's Demo” action
- Short explanation of jobs, pathways and future-demand signals

### Von dashboard

- Public-safe demo-profile label
- Between-assignments status
- Availability
- Experience summary
- Readiness credentials
- Top matches
- Upcoming deadlines
- Saved opportunities
- “Build My Bridge Plan” action

### Profile

- Work experience timeline
- Skills grouped by construction, safety, operations, transportation, technical and workplace categories
- Certifications and training
- Target roles
- Editable preferred search counties
- Missing home county displayed as “Not provided,” not Oakland or Concord

### Matches

Separate tabs or sections for:

- Strong pathway matches
- Transferable-skills matches
- Jobs and postings to verify
- Upcoming events
- Future project demand
- Requirements gaps

Add filters for county, city, trade, opportunity type, status, date, experience level and match tier.

### Match detail

- Title and organization
- Match tier and score
- Matched evidence
- Eligibility state
- Requirements gap
- Next action
- Deadline or next date
- County/city
- Source and verification date
- Save control
- External application/contact link

### Relationship view

Show useful relationships such as:

- Von → COMPLETED → Cypress Mandela Pre-Apprenticeship
- Von → WORKED_FOR → UA Local 342
- Von → WORKED_FOR → SFMTA
- Von → SERVED_WITH → U.S. Army
- Von → HAS_CERTIFICATION → Class B CDL
- Von → HAS_CERTIFICATION → OSHA 10
- Von → HAS_SKILL → Hazard Identification
- Von → MATCHED_TO → UA Local 483 Apprenticeship
- Program → PROVIDED_BY → Organization
- Agency → PUBLISHES → Project Demand Signal

The graph can use local data for the shell, but graph queries must sit behind a `GraphRepository` interface.

## Data and product rules

1. A registered apprenticeship is not automatically accepting applications.
2. Hide expired opportunities by default.
3. Label `verify_open`, `contact_program`, `ongoing_verify_details` and `upcoming_verify_details` as “Confirm with provider.”
4. Never display `project_demand_signal` as a job.
5. Do not recommend roles when the resume does not establish a required qualification.
6. Distinguish a transferable skill from direct qualifying experience.
7. Keep application and registration forms as external link-outs.
8. Never collect or scrape applicant PII in this build.
9. Show source and verification date in detail/admin views.
10. Preserve stable IDs for Neo4j upserts.

## Architecture boundaries

Create or preserve these interfaces:

- `WorkerRepository`
- `OpportunityRepository`
- `ProgramRepository`
- `OrganizationRepository`
- `EventRepository`
- `GraphRepository`
- `MatchingService`
- `MatchExplanationService`
- `BridgePlanService`

Use local implementations for this shell. Create clearly marked Neo4j and AI adapters for Qoder, but do not pretend those services are connected.

Do not implement production authentication, real applicant intake, live scraping, automated application submission, real messaging, production AI calls or background refresh jobs.

## Qoder handoff

Create or update:

- `HANDOFF_TO_QODER.md`
- `QODER_BUILD_PLAN.md`
- `.env.example`

`HANDOFF_TO_QODER.md` must document:

- Product story and judging flow
- Current routes
- Component map
- Local data loader
- Worker and opportunity schemas
- Match scoring and explanation logic
- Neo4j nodes and relationship types
- Repository/service interfaces
- Proposed API contracts
- What is mocked
- What Qoder must implement
- Exact setup, lint, test and build commands
- Known limitations

`QODER_BUILD_PLAN.md` must divide work into:

- Must finish for the hackathon
- Should finish if time remains
- Post-hackathon

Include measurable acceptance criteria for every task.

`.env.example` may contain names only:

```text
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
AI_API_KEY=
```

Never place actual credentials in source control.

## Quality gate

Before finishing:

1. Run lint.
2. Run type checking.
3. Run tests.
4. Run the production build.
5. Fix errors caused by your changes.
6. Confirm all navigation works.
7. Confirm Marcus, Roger and Jamal are gone where they represented the demo worker.
8. Confirm Von is the only demo worker.
9. Search the repository for Von's legal name, phone number, email and LinkedIn URL; the search must return no public-code or fixture matches.
10. Confirm Cypress Mandela appears as completed history, not a recommendation.
11. Confirm requirements-gap roles never appear as strong matches.
12. Confirm expired records do not appear in default results.
13. Confirm project-demand records never appear under Jobs.
14. Confirm no credentials, secrets or raw resume were committed.

## Final response

Report:

1. Audit findings
2. Files created
3. Files modified
4. Routes completed
5. Demo flow completed
6. Privacy checks
7. Test, lint and build results
8. Remaining Qoder work
9. Blockers requiring my decision

Do not give me only recommendations. Make the changes and finish the working shell.
