import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { MatchCard } from '../components/MatchCard';
import { formatDate, SourceInfo } from '../components/SourceInfo';
import { StatusBadge, TierBadge } from '../components/StatusBadge';
import { BenchBridgeLogo, BenchBridgeMark } from '../components/BenchBridgeLogo';
import { BoltIcon, CheckCircleIcon, ClipboardIcon, GearIcon, HelmetIcon, ShieldIcon, TargetIcon, TruckIcon, WrenchIcon } from '../components/icons';
import { LoadingMatchState, MatchReasons, MatchStrengthBadge, ProgressBar, RelationshipPath, SelectionCard, StepHeader, type RelationshipStep } from '../components/ui';
import { demoRuntime } from './runtime';
import { requiresProviderConfirmation, statusLabel } from '../domain/status';
import type {
  DemoAssessmentInput,
  FinancialUrgency,
  GraphEdgeView,
  GraphRecommendation,
  IntakeAvailability,
  IntakeCounty,
  MatchFilters,
  MatchResult,
  Opportunity,
  RecommendationResponse,
  WorkforceEvent,
  WorkPriority,
} from '../domain/types';
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

const workerTypes = [
  { label: 'Construction', Icon: HelmetIcon },
  { label: 'Utility', Icon: BoltIcon },
  { label: 'Transportation', Icon: TruckIcon },
  { label: 'Field Operations', Icon: ClipboardIcon },
  { label: 'Safety', Icon: ShieldIcon },
  { label: 'Skilled Trades', Icon: WrenchIcon },
  { label: 'Equipment Operations', Icon: GearIcon },
];

const valueProps = [
  { label: 'Built for Trades', detail: 'Designed around trade experience, certifications, and availability — not generic job listings.', Icon: HelmetIcon },
  { label: 'Fast Intake', detail: 'Answer by tapping selections. One question per screen, minimal typing.', Icon: BoltIcon },
  { label: 'Smarter Matching', detail: 'Transparent, deterministic ranking connects your evidence to real opportunities.', Icon: TargetIcon },
  { label: 'Know Why You Match', detail: 'Every result shows the specific reasons it fits, plus what to confirm before you act.', Icon: CheckCircleIcon },
];

const howItWorksSteps = [
  { title: 'Build your profile', detail: 'Capture your trade experience, skills, and current availability through a guided, tap-only intake.' },
  { title: 'Get matched', detail: 'BenchBridge ranks live opportunities, pathways, and demand signals connected to your evidence.' },
  { title: 'See why it fits', detail: 'Each match explains the reasons behind it and what to confirm — never a black box.' },
];

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="landing">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Primary">
          <BenchBridgeLogo to="/" />
          <div className="landing-nav-links">
            <a href="#how-it-works">How It Works</a>
            <Link to="/demo/von/intake">For Workers</Link>
            <a href="#value">For Employers</a>
            <Link to="/demo/von">Sign In</Link>
          </div>
        </nav>
        <div className="landing-nav-cta">
          <Link className="button button--primary" to="/demo/von/intake">Get Matched</Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >☰</button>
        </div>
      </header>
      <div className="mobile-menu" id="mobile-menu" hidden={!isMenuOpen}>
        <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
        <Link to="/demo/von/intake" onClick={closeMenu}>For Workers</Link>
        <a href="#value" onClick={closeMenu}>For Employers</a>
        <Link to="/demo/von" onClick={closeMenu}>Sign In</Link>
        <Link className="button button--primary" to="/demo/von/intake" onClick={closeMenu}>Get Matched</Link>
      </div>
      <main>
        <section className="hero">
          <div className="hero__content">
            <span className="hero__badge"><HelmetIcon style={{ width: '1rem', height: '1rem' }} /> Built for the trades</span>
            <h1>From the bench to the next job.</h1>
            <p className="hero__lead">BenchBridge connects tradespeople to work opportunities based on their experience, certifications, location, and availability.</p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/demo/von/intake">Find Work</Link>
              <a className="button button--secondary" href="#how-it-works">See How It Works</a>
            </div>
            <p className="hero__note">Public-safe demonstration. Matches use transparent, deterministic rules — not a live AI service.</p>
          </div>
          <div className="hero-visual">
            <div className="hero-figure" aria-hidden="true"><BenchBridgeMark size={220} /></div>
            <div className="hero-preview">
              <p className="eyebrow">Recommendation preview</p>
              <div className="hero-preview__row"><div><strong>Utility Locator II</strong><span>Alameda County</span></div><MatchStrengthBadge score={91} /></div>
              <div className="hero-preview__row"><div><strong>MC3 Pre-Apprenticeship</strong><span>San Francisco</span></div><MatchStrengthBadge score={78} /></div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="landing-section__head">
            <p className="eyebrow">How it works</p>
            <h2>Three steps from experience to opportunity</h2>
            <p>No resume parsing and no guesswork. Tap through a short intake, then see the reasoning behind every match.</p>
          </div>
          <div className="steps-grid">
            {howItWorksSteps.map((item, index) => (
              <article className="step-card" key={item.title}>
                <span className="step-card__number" aria-hidden="true">{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section__head">
            <p className="eyebrow">Worker types</p>
            <h2>Built for the trades that keep the Bay Area running</h2>
          </div>
          <div className="type-grid">
            {workerTypes.map(({ label, Icon }) => (
              <div className="type-card" key={label}>
                <span className="type-icon" aria-hidden="true"><Icon /></span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section" id="value">
          <div className="landing-section__head">
            <p className="eyebrow">Why BenchBridge</p>
            <h2>Matching that tradespeople can trust</h2>
          </div>
          <div className="value-grid">
            {valueProps.map(({ label, detail, Icon }) => (
              <article className="value-card" key={label}>
                <span className="value-card__icon" aria-hidden="true"><Icon /></span>
                <h3>{label}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <BenchBridgeLogo to="/" />
          <span>Public-safe demonstration using Von's demo data. Deterministic matching — not a live AI service.</span>
        </div>
      </footer>
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
  const relationshipSteps: RelationshipStep[] = [
    { label: 'Von — your experience & skills', kind: 'you' },
    { label: `${match.target.title} · ${match.target.experienceLevel}`, link: 'skills and level match' },
    { label: match.target.organization, kind: 'target', link: 'offered by' },
  ];
  const matchReasons = [
    match.evidence,
    `${match.target.trade.replaceAll('_', ' ')} trade at ${match.target.experienceLevel}`,
    `Located in ${match.target.city}, ${match.target.county} County`,
  ];
  return (
    <>
      <Link className="back-link" to="/demo/von/matches">Back to Matches</Link>
      <PageHeader eyebrow={match.target.opportunityType} title={match.target.title} detail={`${match.target.organization} · ${match.target.county} · ${match.target.city}`} action={<button className="button button--secondary" onClick={() => toggleSaved(match.target.id)}>{saved ? 'Remove saved item' : 'Save this opportunity'}</button>} />
      <section className="detail-hero">
        <div className="badge-row"><MatchStrengthBadge score={match.score} /><TierBadge tier={match.tier} /><StatusBadge status={match.target.status} /></div>
        <div className="detail-score"><strong>{match.score}</strong><span>match score</span></div>
        <dl className="detail-meta"><div><dt>Eligibility state</dt><dd>{match.eligibilityState.replaceAll('_', ' ')}</dd></div><div><dt>Deadline or next date</dt><dd>{formatDate(match.target.deadlineOrDate)}</dd></div><div><dt>Trade</dt><dd>{match.target.trade.replaceAll('_', ' ')}</dd></div><div><dt>Experience level</dt><dd>{match.target.experienceLevel}</dd></div></dl>
      </section>
      <div className="detail-grid">
        <section className="section-block section-block--wide"><p className="eyebrow">Why this match works</p><h2>How BenchBridge found this match</h2><MatchReasons reasons={matchReasons} /><RelationshipPath steps={relationshipSteps} caption="Your path to this opportunity" /></section>
        <section className="section-block"><p className="eyebrow">What is missing or unverified</p><h2>Confirm before acting</h2><p>{match.requirementsGap}</p></section>
        <section className="section-block"><p className="eyebrow">Recommended next action</p><h2>Take a grounded next step</h2><p>{match.recommendedAction}</p>{requiresProviderConfirmation(match.target.status) && <p className="confirmation-note">This record needs confirmation with the provider before treating it as open or available.</p>}<a className="button button--primary" href={match.target.externalUrl} target="_blank" rel="noreferrer">{externalAction}</a></section>
        <section className="section-block"><p className="eyebrow">Research provenance</p><h2>Source and verification</h2><SourceInfo source={match.source} verifiedAsOf={match.target.verifiedAsOf} /><p className="muted">Record status: {statusLabel(match.target.status)}.</p></section>
      </div>
    </>
  );
}

const availabilityOptions: Array<{ value: IntakeAvailability; title: string; detail: string }> = [
  { value: 'available_now', title: 'Available now', detail: 'Prioritize current options and conversations.' },
  { value: 'available_within_30_days', title: 'Available within 30 days', detail: 'Plan around a near-term start date.' },
  { value: 'exploring_options', title: 'Exploring options', detail: 'Review pathways without a near-term start commitment.' },
];

const urgencyOptions: Array<{ value: FinancialUrgency; title: string; detail: string }> = [
  { value: 'high', title: 'High', detail: 'Place current leads and paid pathways earlier in the order.' },
  { value: 'medium', title: 'Medium', detail: 'Balance direct leads with longer-term pathways.' },
  { value: 'low', title: 'Low', detail: 'Keep the focus on fit and future options.' },
];

const workPriorityOptions: Array<{ value: WorkPriority; title: string; detail: string }> = [
  { value: 'direct_work', title: 'Direct work', detail: 'Favor current work leads that still need provider confirmation.' },
  { value: 'paid_pathway', title: 'Paid pathway', detail: 'Favor training or pathway options with a near-term payoff.' },
  { value: 'balanced', title: 'Balanced', detail: 'Keep direct work, pathways, and future demand in view.' },
];

function IntakePage() {
  const navigate = useNavigate();
  const { setPreferredCounties } = useDemoState();
  const [answers, setAnswers] = useState<DemoAssessmentInput | null>(null);
  const [profileEvidence, setProfileEvidence] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void demoRuntime.repositories.intake.getPrefill()
      .then((prefill) => {
        if (!isCurrent) return;
        const source = prefill.assessment ?? prefill.demoAnswers;
        setAnswers({
          preferredCounties: [...source.preferredCounties],
          availability: source.availability,
          financialUrgency: source.financialUrgency,
          workPriority: source.workPriority,
        });
        setProfileEvidence(prefill.profile.graphEvidence);
      })
      .catch(() => {
        if (isCurrent) setError('The Neo4j intake service is unavailable. Confirm the server API and database configuration, then try again.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const toggleCounty = (county: IntakeCounty) => {
    setAnswers((current) => {
      if (!current) return current;
      const isSelected = current.preferredCounties.includes(county);
      if (isSelected && current.preferredCounties.length === 1) return current;
      return {
        ...current,
        preferredCounties: isSelected
          ? current.preferredCounties.filter((item) => item !== county)
          : [...current.preferredCounties, county],
      };
    });
  };

  const saveAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answers) return;
    setError(null);
    setIsSaving(true);
    try {
      await demoRuntime.repositories.intake.saveAssessment(answers);
      setPreferredCounties(answers.preferredCounties);
      navigate('/demo/von/recommendations');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The intake selections could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return <section className="empty-state" role="alert"><h2>Intake unavailable</h2><p>{error}</p><Link className="button button--secondary" to="/demo/von">Return to dashboard</Link></section>;
  }

  if (isLoading || !answers) {
    return <section className="empty-state" aria-live="polite"><h2>Loading public-safe intake</h2><p>Reading Von’s existing graph evidence and saved selections from Neo4j.</p></section>;
  }

  const isLastStep = step === 2;
  const selectedCountyCount = answers.preferredCounties.length;
  const stepLabels = ['Search counties', 'Availability & urgency', 'Priority & review'];

  return (
    <>
      <PageHeader eyebrow="Public-safe check-in" title="What should we prioritize now?" detail="Select only current preferences. This demo does not collect contact details, credentials, or resume text." />
      <section className="intake-context">
        <div><p className="eyebrow">Graph evidence already connected</p><h2>Von’s profile is already in context</h2><div className="tag-list">{profileEvidence.map((evidence) => <span className="tag" key={evidence}>{evidence}</span>)}</div></div>
        <p>Search preferences are not a residence claim. Home county remains not provided.</p>
      </section>
      <ProgressBar step={step} total={3} label={stepLabels[step]} />
      <form className="intake-form" onSubmit={saveAssessment}>
        {step === 0 && <section className="intake-panel"><StepHeader title="Where should we search?" hint="Choose one or both demo search preferences." why="These are search preferences, not a residence claim." /><fieldset className="county-options"><legend className="sr-only">Preferred search counties</legend>{(['San Francisco', 'Alameda'] as IntakeCounty[]).map((county) => {
          const selected = answers.preferredCounties.includes(county);
          return <SelectionCard key={county} name="search-counties" type="checkbox" title={county} detail="Demo search preference" checked={selected} disabled={selected && selectedCountyCount === 1} onChange={() => toggleCounty(county)} />;
        })}</fieldset></section>}
        {step === 1 && <section className="intake-panel"><StepHeader title="When do you want to move?" hint="Pick your current availability." /><fieldset><legend className="sr-only">Current availability</legend><div className="intake-choice-grid">{availabilityOptions.map((option) => <SelectionCard key={option.value} name="availability" type="radio" title={option.title} detail={option.detail} checked={answers.availability === option.value} onChange={() => setAnswers((current) => current ? { ...current, availability: option.value } : current)} />)}</div></fieldset><div className="intake-divider" /><h3>How urgent is near-term income?</h3><fieldset><legend className="sr-only">Financial urgency</legend><div className="intake-choice-grid">{urgencyOptions.map((option) => <SelectionCard key={option.value} name="urgency" type="radio" title={option.title} detail={option.detail} checked={answers.financialUrgency === option.value} onChange={() => setAnswers((current) => current ? { ...current, financialUrgency: option.value } : current)} />)}</div></fieldset><p className="form-note">Urgency changes recommendation order only; it never changes eligibility.</p></section>}
        {step === 2 && <section className="intake-panel"><StepHeader title="Choose a current priority" hint="What should we favor first?" /><fieldset><legend className="sr-only">Current work priority</legend><div className="intake-choice-grid">{workPriorityOptions.map((option) => <SelectionCard key={option.value} name="work-priority" type="radio" title={option.title} detail={option.detail} checked={answers.workPriority === option.value} onChange={() => setAnswers((current) => current ? { ...current, workPriority: option.value } : current)} />)}</div></fieldset><div className="intake-review"><h3>Ready to create the recommendation view?</h3><dl><div><dt>Search counties</dt><dd>{answers.preferredCounties.join(' and ')}</dd></div><div><dt>Availability</dt><dd>{answers.availability.replaceAll('_', ' ')}</dd></div><div><dt>Financial urgency</dt><dd>{answers.financialUrgency}</dd></div><div><dt>Priority</dt><dd>{answers.workPriority.replaceAll('_', ' ')}</dd></div></dl></div></section>}
        <div className="intake-actions"><button className="button button--quiet" type="button" disabled={step === 0 || isSaving} onClick={() => setStep((current) => current - 1)}>Back</button>{isLastStep ? <button className="button button--primary" key="submit-recommendations" type="submit" disabled={isSaving}>{isSaving ? 'Saving public-safe selections…' : 'Create my recommendations'}</button> : <button className="button button--primary" key="continue-intake" type="button" onClick={() => setStep((current) => current + 1)}>Continue</button>}</div>
      </form>
    </>
  );
}

const recommendationLanes = [
  { id: 'recommended', eyebrow: 'Recommended for you', title: 'Pathways to confirm', detail: 'Current training and workforce pathways connected to Von’s graph evidence.' },
  { id: 'lead_to_verify', eyebrow: 'Lead to verify', title: 'Current work leads', detail: 'Potential direct work that requires provider confirmation before it is treated as open.' },
  { id: 'future_demand', eyebrow: 'Future demand', title: 'Public-project signals', detail: 'Signals to monitor, not job openings or application actions.' },
] as const;

function RecommendationCard({ recommendation }: { recommendation: GraphRecommendation }) {
  return <article className="recommendation-card">
    <div className="recommendation-card__heading"><div><p className="eyebrow">{recommendation.organization}</p><h3>{recommendation.title}</h3><p>{recommendation.county} · {recommendation.city} · {recommendation.status.replaceAll('_', ' ')}</p></div><div className="recommendation-score"><strong>{recommendation.priorityScore}</strong><span>priority</span></div></div>
    <p>{recommendation.summary}</p>
    <div className="recommendation-confirm"><strong>Confirm before acting</strong><span>{recommendation.requirementsToConfirm}</span></div>
    <div className="evidence-paths"><p className="eyebrow">Evidence path</p>{recommendation.evidencePaths.map((path) => <div className="evidence-path" key={`${path.from}-${path.relationship}-${path.to}`}><span>{path.from}</span><strong>{path.relationship.replaceAll('_', ' ')}</strong><span>{path.to}</span></div>)}</div>
    <div className="recommendation-actions"><a className="button button--primary" href={recommendation.externalUrl} target="_blank" rel="noreferrer">{recommendation.actionLabel}</a><a className="text-link" href={recommendation.sourceUrl} target="_blank" rel="noreferrer">Source: {recommendation.sourceName}</a></div>
  </article>;
}

const loadingSteps = [
  'Connecting your experience…',
  'Reading your saved selections…',
  'Tracing your graph connections…',
  'Ranking your strongest matches…',
];

function RecommendationsPage() {
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    void demoRuntime.repositories.intake.getRecommendations()
      .then((response) => {
        if (isCurrent) setResult(response);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Recommendations are unavailable.');
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (result || error) return;
    const timer = setInterval(() => {
      setLoadingStep((current) => (current < loadingSteps.length - 1 ? current + 1 : current));
    }, 700);
    return () => clearInterval(timer);
  }, [result, error]);

  if (error) {
    return <section className="empty-state" role="alert"><h2>Recommendations need an intake</h2><p>{error}</p><Link className="button button--primary" to="/demo/von/intake">Complete public-safe intake</Link></section>;
  }

  if (!result) {
    return <LoadingMatchState steps={loadingSteps} activeIndex={loadingStep} />;
  }

  return (
    <>
      <PageHeader eyebrow="Graph-backed recommendations" title="A grounded next move" detail="These results use saved current selections plus public-safe Neo4j relationships. They use transparent deterministic rules, not a live AI service." action={<Link className="button button--secondary" to="/demo/von/intake">Update selections</Link>} />
      <section className="recommendation-summary"><div><p className="eyebrow">Current check-in</p><h2>{result.assessment.preferredCounties.join(' and ')}</h2><p>{result.assessment.availability.replaceAll('_', ' ')} · {result.assessment.financialUrgency} urgency · {result.assessment.workPriority.replaceAll('_', ' ')}</p></div><p>Eligibility is graph-derived. Financial urgency changes priority order only.</p></section>
      <section className="recommendation-stages"><p className="eyebrow">Completed backend actions</p><ol>{result.stages.map((stage) => <li key={stage.id}><span>✓</span><div><strong>{stage.label}</strong><p>{stage.detail}</p></div></li>)}</ol></section>
      {recommendationLanes.map((lane) => {
        const recommendations = result.recommendations.filter((recommendation) => recommendation.lane === lane.id);
        return <section className="recommendation-lane" key={lane.id}><div className="section-heading"><div><p className="eyebrow">{lane.eyebrow}</p><h2>{lane.title}</h2><p>{lane.detail}</p></div><span className="count-pill">{recommendations.length}</span></div>{recommendations.length ? <div className="recommendation-grid">{recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}</div> : <EmptyState title="No eligible connections in this lane" detail="This result contains only existing graph matches that meet the demo safeguards." />}</section>;
      })}
      <section className="graph-bridge-plan"><div><p className="eyebrow">Deterministic Bridge Plan</p><h2>Take the next three grounded steps</h2><p>Built from the ranked eligible graph recommendations.</p></div><ol>{result.bridgePlan.map((action) => <li key={`${action.priority}-${action.title}`}><span>{action.priority}</span><div><strong>{action.title}</strong><p>{action.evidence}</p><small>{action.action}</small></div></li>)}</ol></section>
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
  return <Routes><Route element={<AppShell />}><Route path="/" element={<LandingPage />} /><Route path="/demo/von" element={<DashboardPage />} /><Route path="/demo/von/intake" element={<IntakePage />} /><Route path="/demo/von/recommendations" element={<RecommendationsPage />} /><Route path="/demo/von/profile" element={<ProfilePage />} /><Route path="/demo/von/matches" element={<MatchesPage />} /><Route path="/demo/von/matches/:matchId" element={<MatchDetailPage />} /><Route path="/demo/von/graph" element={<RelationshipPage />} /><Route path="/demo/von/bridge-plan" element={<BridgePlanPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
