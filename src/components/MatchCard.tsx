import { Link } from 'react-router-dom';
import type { MatchResult } from '../domain/types';
import { TierBadge, StatusBadge } from './StatusBadge';
import { SourceInfo } from './SourceInfo';

export function MatchCard({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
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
        <TierBadge tier={match.tier} />
        <StatusBadge status={match.target.status} />
      </div>
      {!compact && (
        <>
          <p><strong>Why it connects:</strong> {match.evidence}</p>
          <p><strong>Confirm or build:</strong> {match.requirementsGap}</p>
        </>
      )}
      <SourceInfo source={match.source} verifiedAsOf={match.target.verifiedAsOf} />
      <Link className="text-link" to={`/demo/von/matches/${match.id}`}>View explanation</Link>
    </article>
  );
}
