import type { MatchTier, Opportunity, Program, WorkforceEvent } from './types';

const confirmStatuses = new Set([
  'verify_open',
  'contact_program',
  'ongoing_verify_details',
  'upcoming_verify_details',
  'year_round_verify_details',
  'verify_program_intake',
]);

export const tierLabel: Record<MatchTier, string> = {
  strong_pathway_match: 'Strong pathway match',
  transferable_skills_match: 'Transferable-skills match',
  future_demand_signal: 'Future demand signal',
  requirements_gap: 'Requirements gap',
};

export function requiresProviderConfirmation(status: string): boolean {
  return confirmStatuses.has(status);
}

export function statusLabel(status: string): string {
  if (requiresProviderConfirmation(status)) return 'Confirm with provider';
  if (status === 'not_a_job') return 'Project signal, not a job';
  if (status === 'expired') return 'Expired';
  if (status === 'active' || status === 'active_continuous' || status === 'active_bid') return 'Current record';
  return status.replaceAll('_', ' ');
}

export function isExpired(opportunity: Opportunity): boolean {
  return opportunity.status === 'expired';
}

export function isPastEvent(event: WorkforceEvent): boolean {
  return event.status.startsWith('past_');
}

export function isCypressMandela(program: Program): boolean {
  return program.program_id === 'PRG-CYPRESS-PA';
}
