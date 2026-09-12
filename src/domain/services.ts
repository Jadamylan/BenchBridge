import type { BridgePlanAction, MatchFilters, MatchResult } from './types';

export interface MatchingService {
  getMatches(): MatchResult[];
  getMatch(matchId: string): MatchResult | undefined;
  getBestMatches(): MatchResult[];
  filterMatches(filters: MatchFilters): MatchResult[];
}

export interface MatchExplanationService {
  getExplanation(matchId: string): MatchResult | undefined;
}

export interface BridgePlanService {
  buildPlan(): BridgePlanAction[];
}

export interface AIService {
  generateBridgePlan(workerId: string): Promise<BridgePlanAction[]>;
}
