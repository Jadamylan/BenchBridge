import { describe, expect, it } from 'vitest';
import type { DemoAssessmentInput } from '../src/domain/types.js';
import {
  IntakeValidationError,
  buildGraphBridgePlan,
  parseDemoAssessmentInput,
  toGraphRecommendation,
  type GraphRecommendationCandidate,
} from './intake.js';

const assessment: DemoAssessmentInput = {
  preferredCounties: ['San Francisco', 'Alameda'],
  availability: 'available_now',
  financialUrgency: 'high',
  workPriority: 'balanced',
};

const directLead: GraphRecommendationCandidate = {
  id: 'OPP-DEMO-001',
  workerName: 'Von',
  targetType: 'Opportunity',
  tier: 'transferable_skills_match',
  title: 'Utility Field Support',
  organization: 'Demo Provider',
  county: 'Alameda',
  city: 'Oakland',
  status: 'verify_with_provider',
  externalUrl: 'https://example.test/opportunity',
  sourceName: 'Demo source',
  sourceUrl: 'https://example.test/source',
  graphSummary: 'Existing graph evidence supports this connection.',
  requirementsToConfirm: 'Confirm the current opening with the provider.',
  graphEvidence: ['Job-site safety standards and procedures'],
};

describe('parseDemoAssessmentInput', () => {
  it('accepts the selection-only demo contract', () => {
    expect(parseDemoAssessmentInput(assessment)).toEqual(assessment);
  });

  it('rejects properties outside the selection-only contract', () => {
    expect(() => parseDemoAssessmentInput({ ...assessment, notes: 'extra content' })).toThrow(IntakeValidationError);
  });

  it('rejects duplicate county preferences', () => {
    expect(() => parseDemoAssessmentInput({ ...assessment, preferredCounties: ['Alameda', 'Alameda'] })).toThrow(IntakeValidationError);
  });
});

describe('toGraphRecommendation', () => {
  it('uses high urgency to prioritize an eligible direct lead without changing its lane', () => {
    const highUrgency = toGraphRecommendation(directLead, assessment);
    const lowUrgency = toGraphRecommendation(directLead, { ...assessment, financialUrgency: 'low' });

    expect(highUrgency.lane).toBe('lead_to_verify');
    expect(highUrgency.priorityScore).toBeGreaterThan(lowUrgency.priorityScore);
    expect(highUrgency.evidencePaths).toEqual([
      { from: 'Von', relationship: 'HAS_SKILL', to: 'Job-site safety standards and procedures' },
      { from: 'Von', relationship: 'MATCHED_TO', to: 'Utility Field Support' },
    ]);
  });

  it('creates a stable three-step Bridge Plan from ranked eligible recommendations', () => {
    const first = toGraphRecommendation(directLead, assessment);
    const second = toGraphRecommendation({ ...directLead, id: 'OPP-DEMO-002', title: 'Transit Operations Support' }, assessment);

    expect(buildGraphBridgePlan([first, second])).toEqual([
      {
        priority: 1,
        title: 'Utility Field Support',
        lane: 'lead_to_verify',
        action: 'Open source and verify the current opening',
        evidence: 'Existing graph evidence supports this connection.',
      },
      {
        priority: 2,
        title: 'Transit Operations Support',
        lane: 'lead_to_verify',
        action: 'Open source and verify the current opening',
        evidence: 'Existing graph evidence supports this connection.',
      },
    ]);
  });
});
