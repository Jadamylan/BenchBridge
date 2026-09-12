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
  tradeLevel: 'journeyman',
  tradeExperience: ['Electrical', 'Construction'],
  certifications: ['OSHA 10', 'Journeyman License'],
};

const calmAssessment: DemoAssessmentInput = {
  ...assessment,
  availability: 'exploring_options',
  financialUrgency: 'low',
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
  tradeCategories: '',
  preferredCertifications: '',
  experienceLevelText: 'On-the-job training stated by the provider.',
};

const alignedLead: GraphRecommendationCandidate = {
  ...directLead,
  tradeCategories: 'electrical;general_construction',
  preferredCertifications: 'OSHA 10;Confined Space',
  experienceLevelText: 'journey-level or qualifying apprenticeship',
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

  it('rejects unknown trade level, trade experience, and certification values', () => {
    expect(() => parseDemoAssessmentInput({ ...assessment, tradeLevel: 'master_tradesman' })).toThrow(IntakeValidationError);
    expect(() => parseDemoAssessmentInput({ ...assessment, tradeExperience: ['Welding'] })).toThrow(IntakeValidationError);
    expect(() => parseDemoAssessmentInput({ ...assessment, certifications: ['OSHA 40'] })).toThrow(IntakeValidationError);
  });

  it('collapses certifications to None of the above when it is selected', () => {
    expect(parseDemoAssessmentInput({ ...assessment, certifications: ['OSHA 10', 'None of the above'] }).certifications)
      .toEqual(['None of the above']);
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

  it('raises priority when trade experience and certifications overlap the target', () => {
    const aligned = toGraphRecommendation(alignedLead, calmAssessment);
    const unrelated = toGraphRecommendation(
      { ...alignedLead, tradeCategories: 'plumbing', preferredCertifications: 'EPA 608' },
      calmAssessment,
    );

    expect(aligned.lane).toBe(unrelated.lane);
    expect(aligned.priorityScore).toBeGreaterThan(unrelated.priorityScore);
  });

  it('gives no certification priority when None of the above is selected', () => {
    const holdsCertification = toGraphRecommendation(alignedLead, calmAssessment);
    const holdsNone = toGraphRecommendation(alignedLead, { ...calmAssessment, certifications: ['None of the above'] });

    expect(holdsCertification.priorityScore).toBeGreaterThan(holdsNone.priorityScore);
  });

  it('keeps a journey-level lead eligible for an apprentice at a lower priority', () => {
    const journeyOnlyLead = { ...alignedLead, experienceLevelText: 'journey-level experience required' };
    const apprentice = toGraphRecommendation(journeyOnlyLead, { ...calmAssessment, tradeLevel: 'apprentice' });
    const journeyman = toGraphRecommendation(journeyOnlyLead, calmAssessment);

    expect(apprentice.lane).toBe('lead_to_verify');
    expect(apprentice.priorityScore).toBeLessThan(journeyman.priorityScore);
    expect(apprentice.priorityScore).toBeGreaterThan(0);
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
