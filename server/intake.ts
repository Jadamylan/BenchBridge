import type {
  CertificationSelection,
  DemoAssessmentInput,
  FinancialUrgency,
  GraphBridgePlanAction,
  GraphRecommendation,
  IntakeAvailability,
  IntakeCounty,
  RecommendationLane,
  TradeExperience,
  TradeLevel,
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
const tradeLevelValues = new Set<TradeLevel>(['apprentice', 'journeyman']);
const tradeExperienceValues = new Set<TradeExperience>([
  'Electrical',
  'Construction',
  'Plumbing',
  'HVAC',
  'Boilermaker',
]);
const certificationValues = new Set<CertificationSelection>([
  'OSHA 10',
  'OSHA 30',
  'Forklift Certification',
  'First Aid / CPR',
  'NCCER',
  'EPA 608',
  'Journeyman License',
  'CDL',
  'Welding Certification',
  'Confined Space',
  'Scissor Lift / Aerial Lift',
  'None of the above',
]);
export const NONE_OF_THE_ABOVE = 'None of the above';
const inputKeys = new Set([
  'preferredCounties',
  'availability',
  'financialUrgency',
  'workPriority',
  'tradeLevel',
  'tradeExperience',
  'certifications',
]);

export const DEMO_ANSWERS: DemoAssessmentInput = {
  preferredCounties: ['San Francisco', 'Alameda'],
  availability: 'available_now',
  financialUrgency: 'high',
  workPriority: 'balanced',
  tradeLevel: 'journeyman',
  tradeExperience: ['Construction', 'Electrical'],
  certifications: ['OSHA 10', 'CDL'],
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
  tradeCategories: string;
  preferredCertifications: string;
  experienceLevelText: string;
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
  if (typeof value.tradeLevel !== 'string' || !tradeLevelValues.has(value.tradeLevel as TradeLevel)) {
    throw new IntakeValidationError();
  }

  const tradeExperience = parseSelectionList(value.tradeExperience, tradeExperienceValues);
  const certifications = parseSelectionList(value.certifications, certificationValues);

  return {
    preferredCounties,
    availability: value.availability as IntakeAvailability,
    financialUrgency: value.financialUrgency as FinancialUrgency,
    workPriority: value.workPriority as WorkPriority,
    tradeLevel: value.tradeLevel as TradeLevel,
    tradeExperience,
    certifications: certifications.includes(NONE_OF_THE_ABOVE) ? [NONE_OF_THE_ABOVE] : certifications,
  };
}

function parseSelectionList<T extends string>(value: unknown, allowed: Set<T>): T[] {
  if (!Array.isArray(value) || !value.every((item): item is T => typeof item === 'string' && allowed.has(item as T))) {
    throw new IntakeValidationError();
  }
  if (new Set(value).size !== value.length) {
    throw new IntakeValidationError();
  }
  return [...value];
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

  const targetTrades = splitTokens(candidate.tradeCategories);
  const tradeOverlap = assessment.tradeExperience.some((trade) => {
    const token = trade.toLowerCase();
    return targetTrades.some((target) => target.includes(token) || token.includes(target));
  });
  if (tradeOverlap) score += 6;

  const preferredCertifications = splitTokens(candidate.preferredCertifications);
  const heldCertifications = assessment.certifications
    .filter((certification) => certification !== NONE_OF_THE_ABOVE)
    .map((certification) => certification.toLowerCase());
  if (heldCertifications.some((certification) => preferredCertifications.includes(certification))) score += 5;

  const levelText = `${candidate.title} ${candidate.experienceLevelText}`.toLowerCase();
  const journeyRole = levelText.includes('journey');
  const apprenticeRole = levelText.includes('apprentice');
  if (assessment.tradeLevel === 'journeyman' && journeyRole) score += 4;
  if (assessment.tradeLevel === 'apprentice' && apprenticeRole) score += 4;
  if (assessment.tradeLevel === 'apprentice' && journeyRole && !apprenticeRole) score -= 6;
  if (assessment.tradeLevel === 'journeyman' && apprenticeRole && !journeyRole) score -= 3;

  return Math.min(score, 99);
}

function splitTokens(value: string): string[] {
  return value.split(';').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function actionLabel(lane: RecommendationLane): string {
  if (lane === 'lead_to_verify') return 'Open source and verify the current opening';
  if (lane === 'future_demand') return 'Monitor the public project source; this is not a job application';
  return 'Open provider source and confirm current intake details';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
