import type {
  DemoAssessmentInput,
  FinancialUrgency,
  GraphBridgePlanAction,
  GraphRecommendation,
  IntakeAvailability,
  IntakeCounty,
  RecommendationLane,
  WorkPriority,
} from '../src/domain/types.js';

const counties = new Set<IntakeCounty>(['San Francisco', 'Alameda']);
const availabilityValues = new Set<IntakeAvailability>([
  'available_now',
  'available_within_30_days',
  'exploring_options',
]);
const urgencyValues = new Set<FinancialUrgency>(['high', 'medium', 'low']);
const workPriorityValues = new Set<WorkPriority>(['direct_work', 'paid_pathway', 'balanced']);
const inputKeys = new Set(['preferredCounties', 'availability', 'financialUrgency', 'workPriority']);

export const DEMO_ANSWERS: DemoAssessmentInput = {
  preferredCounties: ['San Francisco', 'Alameda'],
  availability: 'available_now',
  financialUrgency: 'high',
  workPriority: 'balanced',
};

export class IntakeValidationError extends Error {
  constructor() {
    super('The intake selections are invalid.');
    this.name = 'IntakeValidationError';
  }
}

export class AssessmentNotFoundError extends Error {
  constructor() {
    super('Complete the intake before requesting recommendations.');
    this.name = 'AssessmentNotFoundError';
  }
}

export interface GraphRecommendationCandidate {
  id: string;
  workerName: string;
  targetType: 'Program' | 'Opportunity';
  tier: 'strong_pathway_match' | 'transferable_skills_match' | 'future_demand_signal';
  title: string;
  organization: string;
  county: string;
  city: string;
  status: string;
  externalUrl: string;
  sourceName: string;
  sourceUrl: string;
  graphSummary: string;
  requirementsToConfirm: string;
  graphEvidence: string[];
}

export function parseDemoAssessmentInput(value: unknown): DemoAssessmentInput {
  if (!isRecord(value) || Object.keys(value).length !== inputKeys.size || Object.keys(value).some((key) => !inputKeys.has(key))) {
    throw new IntakeValidationError();
  }

  const preferredCounties = value.preferredCounties;
  if (!Array.isArray(preferredCounties) || preferredCounties.length === 0 || preferredCounties.length > counties.size) {
    throw new IntakeValidationError();
  }
  if (!preferredCounties.every((county): county is IntakeCounty => typeof county === 'string' && counties.has(county as IntakeCounty))) {
    throw new IntakeValidationError();
  }
  if (new Set(preferredCounties).size !== preferredCounties.length) {
    throw new IntakeValidationError();
  }
  if (typeof value.availability !== 'string' || !availabilityValues.has(value.availability as IntakeAvailability)) {
    throw new IntakeValidationError();
  }
  if (typeof value.financialUrgency !== 'string' || !urgencyValues.has(value.financialUrgency as FinancialUrgency)) {
    throw new IntakeValidationError();
  }
  if (typeof value.workPriority !== 'string' || !workPriorityValues.has(value.workPriority as WorkPriority)) {
    throw new IntakeValidationError();
  }

  return {
    preferredCounties,
    availability: value.availability as IntakeAvailability,
    financialUrgency: value.financialUrgency as FinancialUrgency,
    workPriority: value.workPriority as WorkPriority,
  };
}

export function toGraphRecommendation(
  candidate: GraphRecommendationCandidate,
  assessment: DemoAssessmentInput,
): GraphRecommendation {
  const lane = recommendationLane(candidate);
  return {
    id: candidate.id,
    lane,
    tier: candidate.tier,
    priorityScore: priorityScore(candidate, assessment, lane),
    title: candidate.title,
    organization: candidate.organization,
    county: candidate.county,
    city: candidate.city,
    status: candidate.status,
    actionLabel: actionLabel(lane),
    externalUrl: candidate.externalUrl,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    summary: candidate.graphSummary,
    requirementsToConfirm: candidate.requirementsToConfirm,
    evidencePaths: [
      ...candidate.graphEvidence.map((skill) => ({
        from: candidate.workerName,
        relationship: 'HAS_SKILL',
        to: skill,
      })),
      {
        from: candidate.workerName,
        relationship: 'MATCHED_TO',
        to: candidate.title,
      },
    ],
  };
}

export function buildGraphBridgePlan(recommendations: GraphRecommendation[]): GraphBridgePlanAction[] {
  return recommendations.slice(0, 3).map((recommendation, index) => ({
    priority: index + 1,
    title: recommendation.title,
    lane: recommendation.lane,
    action: recommendation.actionLabel,
    evidence: recommendation.summary,
  }));
}

function recommendationLane(candidate: GraphRecommendationCandidate): RecommendationLane {
  if (candidate.tier === 'future_demand_signal') return 'future_demand';
  return candidate.targetType === 'Opportunity' ? 'lead_to_verify' : 'recommended';
}

function priorityScore(
  candidate: GraphRecommendationCandidate,
  assessment: DemoAssessmentInput,
  lane: RecommendationLane,
): number {
  let score = candidate.tier === 'strong_pathway_match'
    ? 80
    : candidate.tier === 'transferable_skills_match'
      ? 73
      : 58;

  if (assessment.preferredCounties.includes(candidate.county as IntakeCounty)) score += 5;
  if (assessment.availability === 'available_now' && lane !== 'future_demand') score += 6;
  if (assessment.availability === 'available_within_30_days' && lane === 'recommended') score += 3;
  if (assessment.financialUrgency === 'high' && lane === 'lead_to_verify') score += 14;
  if (assessment.financialUrgency === 'high' && lane === 'recommended') score += 8;
  if (assessment.financialUrgency === 'medium' && lane !== 'future_demand') score += 4;
  if (assessment.workPriority === 'direct_work' && lane === 'lead_to_verify') score += 9;
  if (assessment.workPriority === 'paid_pathway' && lane === 'recommended') score += 9;

  return Math.min(score, 99);
}

function actionLabel(lane: RecommendationLane): string {
  if (lane === 'lead_to_verify') return 'Open source and verify the current opening';
  if (lane === 'future_demand') return 'Monitor the public project source; this is not a job application';
  return 'Open provider source and confirm current intake details';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
