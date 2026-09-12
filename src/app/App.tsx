import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { MatchCard } from '../components/MatchCard';
import { formatDate, SourceInfo } from '../components/SourceInfo';
import { StatusBadge, TierBadge } from '../components/StatusBadge';
import { demoRuntime } from './runtime';
import { requiresProviderConfirmation, statusLabel } from '../domain/status';
import type { GraphEdgeView, MatchFilters, MatchResult, Opportunity, WorkforceEvent } from '../domain/types';
import { useDemoState } from '../state/DemoState';
import { getFeaturedEvents, getReadinessSignals, getUpcomingDates } from '../services/demoSelectors';

function PageHeader({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-header__detail">{detail}</p>
      </div>
      {action}
    </header>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><h3>{title}</h3><p>{detail}</p></div>;
}

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand"><span className="brand-mark">B</span>BenchBridge</Link>
        <Link className="button button--quiet" to="/demo/von">View Von's Demo</Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Careers between assignments</p>
            <h1>Your next move, explained.</h1>
            <p className="hero__lead">BenchBridge connects skilled-trades experience to jobs, union pathways, workforce support, and future demand—with clear evidence behind every recommendation.</p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/demo/von">Find My Next Move</Link>
              <Link className="button button--secondary" to="/demo/von">View Von's Demo</Link>
            </div>
            <p className="hero__note">Local, public-safe demonstration. Recommendations use transparent deterministic rules, not a live AI service.</p>
          </div>
          <div className="hero-panel" aria-label="BenchBridge recommendation overview">
            <p className="eyebrow">The bridge</p>
            <div className="bridge-step"><span>01</span><div><strong>Evidence</strong><p>Skills, training, work history</p></div></div>
            <div className="bridge-step"><span>02</span><div><strong>Connection</strong><p>Jobs, pathways, events, demand signals</p></div></div>
            <div className="bridge-step"><span>03</span><div><strong>Next action</strong><p>What to verify, prepare, or pursue</p></div></div>
          </div>
        </section>
        <section className="landing-section" id="how-it-works">
          <p className="eyebrow">How it works</p>
          <h2>More than a job board</h2>
          <div className="feature-grid">
            <article><h3>See the connection</h3><p>Every match explains the experience, skills, and credentials that make it relevant.</p></article>
            <article><h3>Know what to confirm</h3><p>Gaps and uncertain availability remain visible, so a lead is never presented as a guarantee.</p></article>
            <article><h3>Plan the bridge</h3><p>Turn a mix of pathways, events, and demand signals into a practical next-step plan.</p></article>
          </div>
        </section>
        <section className="landing-section landing-section--signal">
          <div><p className="eyebrow">Built for the real path</p><h2>Jobs now. Pathways next. Demand ahead.</h2></div>
          <p>BenchBridge separates direct leads from apprenticeships, workforce events, and public projects that may create future worker demand.</p>
        </section>
      </main>
    </div>
  );
}

function DashboardPage() {
  const worker = demoRuntime.repositories.workers.getDemoWorker();
  const topMatches = demoRuntime.matching.getBestMatches().slice(0, 3);
  const readiness = getReadinessSignals(demoRuntime.repositories.workers);
  const upcoming = getUpcomingDates(demoRuntime.matching.getBestMatches(), demoRuntime.repositories.events);
  const { savedIds } = useDemoState();
  const saved = demoRuntime.matching.getMatches().filter((match) => savedIds.includes(match.target.id));

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${worker.displayName}`}
        detail="A public-safe demo view of readiness, relevant connections, and next steps."
        action={<Link className="button button--primary" to="/demo/von/bridge-plan">Build My Bridge Plan</Link>}
      />
      <section className="status-banner">
        <div><p className="eyebrow">Current status</p><h2>Between assignments</h2><p>Available for the next opportunity in the Bay Area.</p></div>
        <div className="status-banner__meta"><span>Profile location</span><strong>{worker.currentRegion}</strong></div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Readiness snapshot</p><h2>Evidence already in the profile</h2></div><Link className="text-link" to="/demo/von/profile">View full profile</Link></div>
        <div className="readiness-grid">
          {readiness.map((item) => <article className="readiness-card" key={item.label}><span className="readiness-card__mark" aria-hidden="true">✓</span><h3>{item.label}</h3><p>{item.evidence}</p></article>)}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Best matches</p><h2>Strong next connections</h2></div><Link className="text-link" to="/demo/von/matches">See all matches</Link></div>
          <div className="stack">{topMatches.map((match) => <MatchCard key={match.id} match={match} compact />)}</div>
        </section>
        <aside className="dashboard-side">
          <section className="side-card"><p className="eyebrow">Upcoming dates</p><h2>Keep on the radar</h2>{upcoming.map((item) => <div className="date-row" key={`${item.label}-${item.date}`}><div><strong>{formatDate(item.date)}</strong><span>{item.kind}</span></div><p>{item.label}</p></div>)}</section>
          <section className="side-card"><p className="eyebrow">Saved opportunities</p><h2>{saved.length} saved</h2>{saved.length ? <ul className="simple-list">{saved.map((match) => <li key={match.id}><Link to={`/demo/von/matches/${match.id}`}>{match.target.title}</Link></li>)}</ul> : <p className="muted">Save a match to keep it here for this local demo.</p>}</section>
        </aside>
      </div>
      <section className="section-block recommended-actions">
        <div className="section-heading"><div><p className="eyebrow">Recommended next actions</p><h2>Start with verified conversations</h2></div></div>
        <ol>{topMatches.map((match) => <li key={match.id}><strong>{match.target.title}</strong><span>{match.recommendedAction}</span></li>)}</ol>
      </section>
    </>
  );
}

function ProfilePage() {
  const worker = demoRuntime.repositories.workers.getDemoWorker();
  const experience = demoRuntime.repositories.workers.getExperience(worker.workerId).sort((a, b) => b.end_date.localeCompare(a.end_date));
  const skills = demoRuntime.repositories.workers.getSkills(worker.workerId);
  const certifications = demoRuntime.repositories.workers.getCertifications(worker.workerId);
  const { preferredCounties, setPreferredCounties } = useDemoState();
  const categories = ['construction', 'safety', 'operations', 'transportation', 'technical', 'workplace'];
  const training = experience.find((item) => item.experience_type === 'mc3_pre_apprenticeship');
  const countyOptions = ['San Francisco', 'Alameda'];

  const toggleCounty = (county: string) => {
    setPreferredCounties(preferredCounties.includes(county) ? preferredCounties.filter((item) => item !== county) : [...preferredCounties, county]);
  };

  return (
    <>
      <PageHeader eyebrow="Public-safe demo profile" title={worker.displayName} detail={worker.experienceSummary} />
      <section className="profile-overview">
        <div><p className="eyebrow">Target role families</p><div className="tag-list">{worker.targetRoles.map((role) => <span className="tag" key={role}>{role}</span>)}</div></div>
        <div><p className="eyebrow">Home county</p><strong>Not provided</strong><p className="muted">Search preferences are not a residency claim.</p></div>
        <div><p className="eyebrow">Availability</p><strong>Available for next opportunity</strong><p className="muted">Verified {formatDate(worker.verifiedAsOf)}</p></div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Experience</p><h2>Work timeline</h2></div></div>
        <div className="timeline">{experience.map((item) => <article className="timeline-item" key={item.experience_id}><div className="timeline-item__date">{item.start_date ? `${formatDate(item.start_date)} — ` : ''}{formatDate(item.end_date)}</div><div><h3>{item.role_title}</h3><p>{item.location}</p><p className="muted">{item.key_evidence}</p></div></article>)}</div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Capabilities</p><h2>Skills with supporting evidence</h2></div></div>
        <div className="skills-grid">{categories.map((category) => <article className="skill-group" key={category}><h3>{category}</h3>{skills.filter((skill) => skill.skill_category === category).map((skill) => <div className="skill-row" key={skill.skill_id}><strong>{skill.skill_name}</strong><span>{skill.proficiency_signal.replaceAll('_', ' ')}</span></div>)}</article>)}</div>
      </section>
      <section className="two-column-section">
        <article className="section-block"><p className="eyebrow">Credentials</p><h2>Certifications and training</h2><div className="credential-list">{certifications.map((certification) => <div key={certification.cert_id}><strong>{certification.certification_name}</strong><span>{certification.status.replaceAll('_', ' ')} · Valid through: {formatDate(certification.valid_through)}</span></div>)}</div></article>
        <article className="section-block completed-training"><p className="eyebrow">Completed training</p><h2>Cypress Mandela</h2><p>{training?.key_evidence}</p><span className="badge badge--neutral">Completed {training ? formatDate(training.end_date) : ''}</span></article>
      </section>
      <section className="section-block preference-panel">
        <div><p className="eyebrow">Local demo setting</p><h2>Preferred search counties</h2><p className="muted">These preferences save only in this browser and never replace the home-county field.</p></div>
        <fieldset><legend className="sr-only">Preferred search counties</legend>{countyOptions.map((county) => <label className="checkbox-row" key={county}><input type="checkbox" checked={preferredCounties.includes(county)} onChange={() => toggleCounty(county)} />{county}</label>)}</fieldset>
      </section>
    </>
  );
}

function MatchSection({ title, detail, matches }: { title: string; detail: string; matches: MatchResult[] }) {
  return <section className="match-section"><div className="section-heading"><div><h2>{title}</h2><p>{detail}</p></div><span className="count-pill">{matches.length}</span></div>{matches.length ? <div className="match-grid">{matches.map((match) => <MatchCard match={match} key={match.id} />)}</div> : <EmptyState title="No results for these filters" detail="Adjust a filter or clear it to see another type of connection." />}</section>;
}

function EventCard({ event }: { event: WorkforceEvent }) {
  const source = demoRuntime.repositories.sources.getById(event.source_id);
  return <article className="event-card"><div><p className="eyebrow">{event.event_type.replaceAll('_', ' ')}</p><h3>{event.name}</h3><p>{formatDate(event.start_date)} · {event.city}</p><StatusBadge status={event.status} /></div><p>{event.notes}</p>{source && <SourceInfo source={source} verifiedAsOf={event.verified_as_of} />}<a className="text-link" href={event.registration_url} target="_blank" rel="noreferrer">Open registration or event source</a></article>;
}

function ArchivedRecord({ opportunity }: { opportunity: Opportunity }) {
  return <article className="archive-card"><div><StatusBadge status="expired" /><h3>{opportunity.title}</h3><p>{opportunity.employer_or_agency} · Deadline was {formatDate(opportunity.deadline)}</p></div><p>This archived record is not a current lead and has no application action.</p></article>;
}

function MatchesPage() {
  const [filters, setFilters] = useState<MatchFilters>({ includeExpired: false, tier: '' });
  const matches = demoRuntime.matching.filterMatches(filters);
  const events = getFeaturedEvents(demoRuntime.repositories.events);
  const expired = filters.includeExpired ? demoRuntime.repositories.opportunities.list(true).filter((item) => item.status === 'expired') : [];
  const pathway = matches.filter((match) => match.tier === 'strong_pathway_match');
  const transferable = matches.filter((match) => match.tier === 'transferable_skills_match');
  const future = matches.filter((match) => match.tier === 'future_demand_signal');
  const gaps = matches.filter((match) => match.tier === 'requirements_gap');

  return (
    <>
      <PageHeader eyebrow="Matches" title="Every connection has context" detail="Filter the local researched data, then open any result to see evidence, missing requirements, and a next action." />
      <section className="filter-panel" aria-label="Match filters">
        <div className="filter-panel__header"><div><p className="eyebrow">Filter matches</p><h2>Refine the search</h2></div><button className="button button--quiet" onClick={() => setFilters({ includeExpired: false, tier: '' })}>Clear filters</button></div>
        <div className="filters">
          <input aria-label="County" placeholder="County" value={filters.county ?? ''} onChange={(event) => setFilters({ ...filters, county: event.target.value })} />
          <input aria-label="City" placeholder="City" value={filters.city ?? ''} onChange={(event) => setFilters({ ...filters, city: event.target.value })} />
          <input aria-label="Trade" placeholder="Trade" value={filters.trade ?? ''} onChange={(event) => setFilters({ ...filters, trade: event.target.value })} />
          <input aria-label="Opportunity type" placeholder="Opportunity type" value={filters.opportunityType ?? ''} onChange={(event) => setFilters({ ...filters, opportunityType: event.target.value })} />
          <input aria-label="Status" placeholder="Status" value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, status: event.target.value })} />
          <input aria-label="Date" placeholder="Date (YYYY-MM)" value={filters.date ?? ''} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          <input aria-label="Experience level" placeholder="Experience level" value={filters.experienceLevel ?? ''} onChange={(event) => setFilters({ ...filters, experienceLevel: event.target.value })} />
          <select aria-label="Match tier" value={filters.tier ?? ''} onChange={(event) => setFilters({ ...filters, tier: event.target.value as MatchFilters['tier'] })}>
            <option value="">All match tiers</option><option value="strong_pathway_match">Strong pathway</option><option value="transferable_skills_match">Transferable skills</option><option value="future_demand_signal">Future demand</option><option value="requirements_gap">Requirements gap</option>
          </select>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={Boolean(filters.includeExpired)} onChange={(event) => setFilters({ ...filters, includeExpired: event.target.checked })} />Show expired archived records</label>
      </section>
      <MatchSection title="Strong pathway matches" detail="Programs aligned with direct construction and training evidence. Verify each provider's current intake." matches={pathway} />
      <MatchSection title="Transferable-skills matches" detail="Relevant experience is present, but details or requirements still need confirmation." matches={transferable} />
      <section className="match-section"><div className="section-heading"><div><h2>Upcoming workforce events</h2><p>Use events to verify current pathways and meet workforce partners.</p></div><span className="count-pill">{events.length}</span></div><div className="event-grid">{events.map((event) => <EventCard event={event} key={event.event_id} />)}</div></section>
      <MatchSection title="Future project demand" detail="Public-project signals that may create downstream workforce demand. These are not jobs or applications." matches={future} />
      <MatchSection title="What you would need" detail="Requirements-gap records are not ready-to-apply recommendations. They are shown to make the path forward clear." matches={gaps} />
      {filters.includeExpired && <section className="match-section"><div className="section-heading"><div><h2>Expired archived records</h2><p>Shown only on request for freshness transparency. They are not current opportunities.</p></div></div><div className="archive-grid">{expired.map((opportunity) => <ArchivedRecord key={opportunity.opportunity_id} opportunity={opportunity} />)}</div></section>}
    </>
  );
}

function MatchDetailPage() {
  const { matchId } = useParams();
  const match = matchId ? demoRuntime.explanations.getExplanation(matchId) : undefined;
  const { isSaved, toggleSaved } = useDemoState();
  if (!match) return <EmptyState title="Match not found" detail="Return to Matches to select a current demo record." />;

  const externalAction = match.target.isProjectDemand ? 'Open project source' : match.tier === 'requirements_gap' ? 'Open source to review requirements' : requiresProviderConfirmation(match.target.status) ? 'Confirm with provider' : 'Open external opportunity';
  const saved = isSaved(match.target.id);
  return (
    <>
      <Link className="back-link" to="/demo/von/matches">Back to Matches</Link>
      <PageHeader eyebrow={match.target.opportunityType} title={match.target.title} detail={`${match.target.organization} · ${match.target.county} · ${match.target.city}`} action={<button className="button button--secondary" onClick={() => toggleSaved(match.target.id)}>{saved ? 'Remove saved item' : 'Save this opportunity'}</button>} />
      <section className="detail-hero">
        <div className="badge-row"><TierBadge tier={match.tier} /><StatusBadge status={match.target.status} /></div>
        <div className="detail-score"><strong>{match.score}</strong><span>match score</span></div>
        <dl className="detail-meta"><div><dt>Eligibility state</dt><dd>{match.eligibilityState.replaceAll('_', ' ')}</dd></div><div><dt>Deadline or next date</dt><dd>{formatDate(match.target.deadlineOrDate)}</dd></div><div><dt>Trade</dt><dd>{match.target.trade.replaceAll('_', ' ')}</dd></div><div><dt>Experience level</dt><dd>{match.target.experienceLevel}</dd></div></dl>
      </section>
      <div className="detail-grid">
        <section className="section-block"><p className="eyebrow">Why it fits Von</p><h2>Evidence in the profile</h2><p>{match.evidence}</p></section>
        <section className="section-block"><p className="eyebrow">What is missing or unverified</p><h2>Confirm before acting</h2><p>{match.requirementsGap}</p></section>
        <section className="section-block"><p className="eyebrow">Recommended next action</p><h2>Take a grounded next step</h2><p>{match.recommendedAction}</p>{requiresProviderConfirmation(match.target.status) && <p className="confirmation-note">This record needs confirmation with the provider before treating it as open or available.</p>}<a className="button button--primary" href={match.target.externalUrl} target="_blank" rel="noreferrer">{externalAction}</a></section>
        <section className="section-block"><p className="eyebrow">Research provenance</p><h2>Source and verification</h2><SourceInfo source={match.source} verifiedAsOf={match.target.verifiedAsOf} /><p className="muted">Record status: {statusLabel(match.target.status)}.</p></section>
      </div>
    </>
  );
}

function RelationshipPage() {
  const [edges, setEdges] = useState<GraphEdgeView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void demoRuntime.repositories.graph.getVonRelationships()
      .then((result) => {
        if (!isCurrent) return;
        setEdges(result);
      })
      .catch(() => {
        if (!isCurrent) return;
        setError('The Neo4j relationship graph is unavailable. Confirm the server API and database configuration, then try again.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const nodes = useMemo(() => new Set(edges.flatMap((edge) => [edge.fromLabel, edge.toLabel])).size, [edges]);
  return (
    <>
      <PageHeader eyebrow="Relationship view" title="Why this bridge exists" detail="A Neo4j-backed graph connects Von's public-safe profile evidence to providers, opportunities, and sources." />
      <section className="graph-summary"><div><strong>{nodes}</strong><span>connected nodes</span></div><div><strong>{edges.length}</strong><span>evidence-backed relationships</span></div><p>Relationship data is read through the server-side API. The browser never receives database credentials.</p></section>
      {isLoading && <section className="empty-state" aria-live="polite"><h2>Loading the relationship graph</h2><p>Reading the current graph projection from Neo4j.</p></section>}
      {error && <section className="empty-state" role="alert"><h2>Relationship graph unavailable</h2><p>{error}</p></section>}
      {!isLoading && !error && <>
        <section className="graph-canvas" aria-label="Relationship graph">
          {edges.map((edge) => <div className="graph-edge" key={`${edge.from_id}-${edge.relationship}-${edge.to_id}`}><span className="graph-node">{edge.fromLabel}</span><span className="graph-link">{edge.relationship.replaceAll('_', ' ')}</span><span className="graph-node graph-node--target">{edge.toLabel}</span></div>)}
        </section>
        <section className="section-block"><p className="eyebrow">Accessible relationship list</p><h2>All relationships in this view</h2><div className="table-wrap"><table><thead><tr><th>From</th><th>Relationship</th><th>To</th><th>Confidence</th></tr></thead><tbody>{edges.map((edge) => <tr key={`table-${edge.from_id}-${edge.relationship}-${edge.to_id}`}><td>{edge.fromLabel}</td><td>{edge.relationship}</td><td>{edge.toLabel}</td><td>{edge.confidence}</td></tr>)}</tbody></table></div></section>
      </>}
    </>
  );
}

function BridgePlanPage() {
  const actions = demoRuntime.bridgePlan.buildPlan();
  return (
    <>
      <PageHeader eyebrow="Bridge Plan" title="A practical path for the next move" detail="This is a local deterministic demo plan drawn from the match records. It is not an AI-generated result." />
      <section className="plan-intro"><span className="badge badge--neutral">Demo result</span><p>The plan prioritizes one immediate pathway, one lead to verify, an event, a future-demand signal, and confirmation steps. Each action points to a real source record.</p></section>
      <ol className="plan-list">{actions.map((action) => <li key={action.id}><div className="plan-number">{action.priority}</div><article><p className="eyebrow">{action.category.replaceAll('_', ' ')}</p><h2>{action.title}</h2>{action.deadlineOrDate && <p className="plan-date">{formatDate(action.deadlineOrDate)}</p>}<p>{action.detail}</p><div className="plan-action"><strong>Next action</strong><span>{action.action}</span></div><SourceInfo source={action.source} verifiedAsOf={action.source.last_verified} /></article></li>)}</ol>
    </>
  );
}

export function App() {
  return <Routes><Route element={<AppShell />}><Route path="/" element={<LandingPage />} /><Route path="/demo/von" element={<DashboardPage />} /><Route path="/demo/von/profile" element={<ProfilePage />} /><Route path="/demo/von/matches" element={<MatchesPage />} /><Route path="/demo/von/matches/:matchId" element={<MatchDetailPage />} /><Route path="/demo/von/graph" element={<RelationshipPage />} /><Route path="/demo/von/bridge-plan" element={<BridgePlanPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
