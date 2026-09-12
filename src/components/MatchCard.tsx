import { Link } from 'react-router-dom';
import type { MatchResult } from '../domain/types';
import { TierBadge, StatusBadge } from './StatusBadge';
import { SourceInfo, formatDate } from './SourceInfo';
import { MatchReasons, MatchStrengthBadge } from './ui';
import { useDemoState } from '../state/DemoState';

function buildMatchReasons(match: MatchResult): string[] {
  const { target, evidence } = match;
  const reasons: string[] = [];
  if (evidence) reasons.push(evidence);
  if (target.trade) reasons.push(`${target.trade.replaceAll('_', ' ')} trade · ${target.experienceLevel}`);
  const place = [target.city, target.county ? `${target.county} County` : ''].filter(Boolean).join(', ');
  if (place) reasons.push(`Located in ${place}`);
  if (target.deadlineOrDate && !/not (listed|provided)/i.test(target.deadlineOrDate)) {
    reasons.push(`Target date ${formatDate(target.deadlineOrDate)}`);
  }
  return reasons.slice(0, 4);
}

export function MatchCard({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
  const { isSaved, toggleSaved } = useDemoState();
  const saved = isSaved(match.target.id);

  return (
    <article className="match-card">
      <div className="match-card__header">
        <div>
          <p className="eyebrow">{match.target.opportunityType}</p>
          <h3>{match.target.title}</h3>
          <p className="muted">{match.target.organization} · {match.target.city}</p>
        </div>
        <div className="match-card__score" aria-label={`Match score ${match.score} out of 100`}>
          <strong>{match.score}</strong><span>match</span>
        </div>
      </div>
      <div className="badge-row">
        <MatchStrengthBadge score={match.score} />
        <TierBadge tier={match.tier} />
        <StatusBadge status={match.target.status} />
      </div>
      {!compact && (
        <>
          <MatchReasons reasons={buildMatchReasons(match)} />
          <p className="match-card__confirm"><strong>Confirm or build:</strong> {match.requirementsGap}</p>
        </>
      )}
      <SourceInfo source={match.source} verifiedAsOf={match.target.verifiedAsOf} />
      <div className="match-card__actions">
        <Link className="button button--secondary" to={`/demo/von/matches/${match.id}`}>View match</Link>
        <button className="button button--quiet" type="button" aria-pressed={saved} onClick={() => toggleSaved(match.target.id)}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </article>
  );
}
