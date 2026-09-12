import type { MatchTier } from '../domain/types';
import { statusLabel, tierLabel } from '../domain/status';

export function TierBadge({ tier }: { tier: MatchTier }) {
  return <span className={`badge badge--${tier}`}>{tierLabel[tier]}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const label = statusLabel(status);
  const kind = label === 'Confirm with provider' ? 'confirm' : status === 'expired' ? 'expired' : 'neutral';
  return <span className={`badge badge--${kind}`}>{label}</span>;
}
