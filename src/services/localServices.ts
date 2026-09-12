import type {
  EventRepository,
  OpportunityRepository,
  OrganizationRepository,
  ProgramRepository,
  SourceRepository,
} from '../domain/repositories';
import type { BridgePlanService, MatchExplanationService, MatchingService } from '../domain/services';
import type {
  BridgePlanAction,
  MatchExample,
  MatchFilters,
  MatchResult,
  MatchTarget,
  Source,
  WorkforceEvent,
} from '../domain/types';
import { isExpired } from '../domain/status';
import { loadBenchBridgeSeed } from '../data/seed';

function contains(value: string, query?: string): boolean {
  return !query || value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export class LocalMatchingService implements MatchingService, MatchExplanationService {
  constructor(
    private readonly opportunities: OpportunityRepository,
    private readonly programs: ProgramRepository,
    private readonly organizations: OrganizationRepository,
    private readonly sources: SourceRepository,
  ) {}

  getMatches(): MatchResult[] {
    return loadBenchBridgeSeed().worker_match_examples.map((match) => this.toMatchResult(match));
  }

  getMatch(matchId: string): MatchResult | undefined {
    return this.getMatches().find((match) => match.id === matchId);
  }

  getExplanation(matchId: string): MatchResult | undefined {
    return this.getMatch(matchId);
  }

  getBestMatches(): MatchResult[] {
    return this.getMatches()
      .filter((match) => match.tier === 'strong_pathway_match' || match.tier === 'transferable_skills_match')
      .filter((match) => !this.isExpiredTarget(match))
      .sort((a, b) => b.score - a.score);
  }

  filterMatches(filters: MatchFilters): MatchResult[] {
    return this.getMatches().filter((match) => {
      if (!filters.includeExpired && this.isExpiredTarget(match)) return false;
      return (
        (!filters.tier || match.tier === filters.tier) &&
        contains(match.target.county, filters.county) &&
        contains(match.target.city, filters.city) &&
        contains(match.target.trade, filters.trade) &&
        contains(match.target.opportunityType, filters.opportunityType) &&
        contains(match.target.status, filters.status) &&
        contains(match.target.deadlineOrDate, filters.date) &&
        contains(match.target.experienceLevel, filters.experienceLevel)
      );
    });
  }

  private isExpiredTarget(match: MatchResult): boolean {
    const opportunity = this.opportunities.getById(match.target.id);
    return Boolean(opportunity && isExpired(opportunity));
  }

  private toMatchResult(match: MatchExample): MatchResult {
    const target = this.getTarget(match);
    const source = this.sources.getById(target.sourceId) ?? this.sources.getById(match.source_id);
    if (!source) throw new Error(`Source is missing for ${match.match_id}.`);

    return {
      id: match.match_id,
      tier: match.match_tier,
      score: match.score,
      eligibilityState: match.eligibility_state,
      evidence: match.matched_evidence,
      requirementsGap: match.requirements_gap,
      recommendedAction: match.recommended_action,
      target,
      source,
    };
  }

  private getTarget(match: MatchExample): MatchTarget {
    if (match.target_type === 'Program') {
      const program = this.programs.getById(match.target_id);
      if (!program) throw new Error(`Program is missing for ${match.match_id}.`);
      return {
        id: program.program_id,
        title: program.name,
        organization: this.organizations.getById(program.provider_org_id)?.name ?? 'Program provider',
        opportunityType: `program · ${program.program_type.replaceAll('_', ' ')}`,
        county: program.county,
        city: program.city,
        status: program.application_status,
        deadlineOrDate: program.next_date || 'No next date published',
        trade: program.trade_categories,
        experienceLevel: program.eligibility,
        externalUrl: program.application_url,
        sourceId: program.source_id,
        verifiedAsOf: program.verified_as_of,
        isProjectDemand: false,
      };
    }

    const opportunity = this.opportunities.getById(match.target_id);
    if (!opportunity) throw new Error(`Opportunity is missing for ${match.match_id}.`);
    return {
      id: opportunity.opportunity_id,
      title: opportunity.title,
      organization: opportunity.employer_or_agency,
      opportunityType: opportunity.opportunity_type,
      county: opportunity.county,
      city: opportunity.city,
      status: opportunity.status,
      deadlineOrDate: opportunity.deadline || 'No deadline published',
      trade: opportunity.trade_categories,
      experienceLevel: opportunity.experience_level,
      externalUrl: opportunity.apply_url,
      sourceId: opportunity.source_id,
      verifiedAsOf: opportunity.verified_as_of,
      isProjectDemand: opportunity.opportunity_type === 'project_demand_signal',
    };
  }
}

export class LocalBridgePlanService implements BridgePlanService {
  constructor(
    private readonly matching: MatchingService,
    private readonly events: EventRepository,
    private readonly sources: SourceRepository,
  ) {}

  buildPlan(): BridgePlanAction[] {
    const matches = this.matching.getMatches();
    const pathway = matches.filter((match) => match.tier === 'strong_pathway_match').sort((a, b) => b.score - a.score)[0];
    const transferable = matches.find(
      (match) => match.tier === 'transferable_skills_match' && match.target.opportunityType === 'job',
    );
    const demandSignal = matches.find((match) => match.tier === 'future_demand_signal');
    const verification = matches.filter((match) => match.tier === 'strong_pathway_match').sort((a, b) => a.score - b.score)[0];
    const event = this.events.list().find((item) => item.event_type === 'job_fair') ?? this.events.list()[0];

    if (!pathway || !transferable || !demandSignal || !verification || !event) {
      throw new Error('The local data does not have enough records to build the demo plan.');
    }

    const eventSource = this.requireSource(event.source_id);
    return [
      this.matchAction(1, 'pathway', pathway, 'Start with the strongest immediate pathway.'),
      this.matchAction(2, 'lead_to_verify', transferable, 'Verify this transferable-skills lead before applying.'),
      {
        id: `event-${event.event_id}`,
        priority: 3,
        category: 'event',
        title: event.name,
        detail: `${event.city} · ${event.start_date}. ${event.notes}`,
        action: 'Confirm attendance details with the host and prepare questions about current openings.',
        source: eventSource,
        deadlineOrDate: event.start_date,
      },
      this.matchAction(4, 'future_demand', demandSignal, 'Monitor downstream contractor and subcontractor demand.'),
      this.matchAction(5, 'confirm', verification, 'Confirm program intake and keep required documents ready.'),
      {
        id: `next-step-${pathway.id}`,
        priority: 6,
        category: 'next_step',
        title: 'Keep evidence ready for provider conversations',
        detail: pathway.evidence,
        action: 'Use the documented experience and credentials to guide a provider conversation; do not claim unverified qualifications.',
        source: pathway.source,
      },
    ];
  }

  private matchAction(
    priority: number,
    category: BridgePlanAction['category'],
    match: MatchResult,
    detailPrefix: string,
  ): BridgePlanAction {
    return {
      id: `${category}-${match.id}`,
      priority,
      category,
      title: match.target.title,
      detail: `${detailPrefix} ${match.requirementsGap}`,
      action: match.recommendedAction,
      source: match.source,
      deadlineOrDate: match.target.deadlineOrDate,
    };
  }

  private requireSource(sourceId: string): Source {
    const source = this.sources.getById(sourceId);
    if (!source) throw new Error(`Source is missing for ${sourceId}.`);
    return source;
  }
}

export function getUpcomingEvents(events: EventRepository): WorkforceEvent[] {
  return events.list();
}
