import neo4j, { type Driver } from 'neo4j-driver';
import type {
  DemoAssessment,
  DemoAssessmentInput,
  IntakePrefill,
  RecommendationResponse,
} from '../src/domain/types.js';
import {
  AssessmentNotFoundError,
  buildGraphBridgePlan,
  DEMO_ANSWERS,
  toGraphRecommendation,
  type GraphRecommendationCandidate,
} from './intake.js';
import { graphEdgeFromRecord, VON_WORKER_ID, vonGraphQuery } from './graph.js';
import type { GraphEdgeView } from '../src/domain/types.js';

const VON_ASSESSMENT_ID = 'ASSESSMENT-WORKER-DEMO-001';
const CYPRESS_MANDELA_PROGRAM_ID = 'PRG-CYPRESS-PA';

const intakePrefillQuery = `
  MATCH (worker:Worker {worker_id: $workerId})
  OPTIONAL MATCH (worker)-[:HAS_CURRENT_ASSESSMENT]->(assessment:Assessment)
  OPTIONAL MATCH (worker)-[:HAS_SKILL]->(skill:Skill)
  WITH worker, assessment, collect(DISTINCT skill.skill_name)[0..3] AS graphEvidence
  RETURN
    worker.worker_id AS worker_id,
    worker.display_name AS display_name,
    worker.target_roles AS target_roles,
    graphEvidence,
    assessment.assessment_id AS assessment_id,
    assessment.preferred_counties AS preferred_counties,
    assessment.availability AS availability,
    assessment.financial_urgency AS financial_urgency,
    assessment.work_priority AS work_priority,
    assessment.trade_level AS trade_level,
    assessment.trade_experience AS trade_experience,
    assessment.certifications AS certifications,
    assessment.updated_at AS updated_at
`;

const upsertAssessmentQuery = `
  MATCH (worker:Worker {worker_id: $workerId})
  MERGE (assessment:Assessment {assessment_id: $assessmentId})
  SET assessment.worker_id = $workerId,
      assessment.preferred_counties = $preferredCounties,
      assessment.availability = $availability,
      assessment.financial_urgency = $financialUrgency,
      assessment.work_priority = $workPriority,
      assessment.trade_level = $tradeLevel,
      assessment.trade_experience = $tradeExperience,
      assessment.certifications = $certifications,
      assessment.updated_at = toString(datetime())
  MERGE (worker)-[assessmentRelationship:HAS_CURRENT_ASSESSMENT]->(assessment)
  SET assessmentRelationship.evidence_source_id = 'SRC-VON-INTAKE',
      assessmentRelationship.confidence = 'self_reported',
      assessmentRelationship.notes = 'Current public-safe intake check-in.'
  WITH worker, assessment
  OPTIONAL MATCH (worker)-[stale:HAS_TRADE_LEVEL|HAS_EXPERIENCE_IN|HOLDS_CERTIFICATION]->()
  DELETE stale
  WITH worker, assessment
  MERGE (level:TradeLevel {level: $tradeLevel})
  SET level.name = $tradeLevel
  MERGE (worker)-[levelRelationship:HAS_TRADE_LEVEL]->(level)
  SET levelRelationship.evidence_source_id = 'SRC-VON-INTAKE',
      levelRelationship.confidence = 'self_reported',
      levelRelationship.notes = 'Current intake selection.'
  FOREACH (tradeName IN $tradeExperience |
    MERGE (trade:Trade {name: tradeName})
    MERGE (worker)-[tradeRelationship:HAS_EXPERIENCE_IN]->(trade)
    SET tradeRelationship.evidence_source_id = 'SRC-VON-INTAKE',
        tradeRelationship.confidence = 'self_reported',
        tradeRelationship.notes = 'Current intake selection.'
  )
  FOREACH (certName IN [certification IN $certifications WHERE certification <> 'None of the above'] |
    MERGE (cert:Certification {name: certName})
    SET cert.origin = 'intake_self_reported'
    MERGE (worker)-[certRelationship:HOLDS_CERTIFICATION]->(cert)
    SET certRelationship.evidence_source_id = 'SRC-VON-INTAKE',
        certRelationship.confidence = 'self_reported',
        certRelationship.notes = 'Current intake selection.'
  )
  RETURN
    assessment.assessment_id AS assessment_id,
    assessment.worker_id AS worker_id,
    assessment.preferred_counties AS preferred_counties,
    assessment.availability AS availability,
    assessment.financial_urgency AS financial_urgency,
    assessment.work_priority AS work_priority,
    assessment.trade_level AS trade_level,
    assessment.trade_experience AS trade_experience,
    assessment.certifications AS certifications,
    assessment.updated_at AS updated_at
`;

const resetAssessmentQuery = `
  MATCH (worker:Worker {worker_id: $workerId})
  OPTIONAL MATCH (worker)-[relationship:HAS_CURRENT_ASSESSMENT]->(assessment:Assessment {assessment_id: $assessmentId})
  OPTIONAL MATCH (worker)-[intakeRelationship:HAS_TRADE_LEVEL|HAS_EXPERIENCE_IN|HOLDS_CERTIFICATION]->()
  DELETE relationship, assessment, intakeRelationship
`;

const recommendationCandidatesQuery = `
  MATCH (worker:Worker {worker_id: $workerId})-[match:MATCHED_TO]->(target)
  WHERE (target:Program OR target:Opportunity)
    AND NOT match.notes STARTS WITH 'requirements_gap:'
    AND NOT (target:Program AND target.program_id = $completedProgramId)
  MATCH (source:Source {source_id: target.source_id})
  OPTIONAL MATCH (organization:Organization)
  WHERE organization.org_id = coalesce(target.provider_org_id, target.org_id)
  OPTIONAL MATCH (worker)-[:HAS_SKILL]->(skill:Skill)
  WITH worker, target, match, source, organization, collect(DISTINCT skill.skill_name)[0..3] AS graphEvidence
  RETURN
    CASE WHEN target:Program THEN target.program_id ELSE target.opportunity_id END AS id,
    worker.display_name AS worker_name,
    CASE WHEN target:Program THEN 'Program' ELSE 'Opportunity' END AS target_type,
    CASE
      WHEN match.notes STARTS WITH 'strong_pathway_match:' THEN 'strong_pathway_match'
      WHEN match.notes STARTS WITH 'transferable_skills_match:' THEN 'transferable_skills_match'
      ELSE 'future_demand_signal'
    END AS tier,
    target.name AS program_name,
    target.title AS opportunity_title,
    coalesce(organization.name, target.employer_or_agency, 'Provider to verify') AS organization,
    target.county AS county,
    target.city AS city,
    coalesce(target.application_status, target.status) AS status,
    coalesce(target.application_url, target.apply_url) AS external_url,
    source.name AS source_name,
    source.primary_url AS source_url,
    coalesce(target.eligibility, target.experience_level, 'Confirm current requirements with the source.') AS requirements_to_confirm,
    coalesce(target.trade_categories, '') AS trade_categories,
    coalesce(target.preferred_certifications, '') AS preferred_certifications,
    coalesce(target.experience_level, '') AS experience_level_text,
    graphEvidence
`;

export class Neo4jGraphReader {
  constructor(
    private readonly driver: Driver,
    private readonly database: string,
  ) {}

  async getVonRelationships(): Promise<GraphEdgeView[]> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result = await session.run(vonGraphQuery, { workerId: VON_WORKER_ID });
      return result.records.map(graphEdgeFromRecord);
    } finally {
      await session.close();
    }
  }

  async getIntakePrefill(): Promise<IntakePrefill> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result = await session.run(intakePrefillQuery, { workerId: VON_WORKER_ID });
      const record = result.records[0];
      if (!record) throw new Error('The demo worker is unavailable.');

      return {
        profile: {
          workerId: requiredString(record, 'worker_id'),
          displayName: requiredString(record, 'display_name'),
          targetRoles: splitValues(requiredString(record, 'target_roles')),
          graphEvidence: stringArray(record.get('graphEvidence')),
        },
        demoAnswers: { ...DEMO_ANSWERS, preferredCounties: [...DEMO_ANSWERS.preferredCounties] },
        assessment: assessmentFromRecord(record),
      };
    } finally {
      await session.close();
    }
  }

  async upsertAssessment(input: DemoAssessmentInput): Promise<DemoAssessment> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result = await session.run(upsertAssessmentQuery, {
        workerId: VON_WORKER_ID,
        assessmentId: VON_ASSESSMENT_ID,
        preferredCounties: input.preferredCounties,
        availability: input.availability,
        financialUrgency: input.financialUrgency,
        workPriority: input.workPriority,
        tradeLevel: input.tradeLevel,
        tradeExperience: input.tradeExperience,
        certifications: input.certifications,
      });
      const record = result.records[0];
      if (!record) throw new Error('The demo worker is unavailable.');
      const assessment = assessmentFromRecord(record);
      if (!assessment) throw new Error('The assessment could not be saved.');
      return assessment;
    } finally {
      await session.close();
    }
  }

  async resetAssessment(): Promise<void> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      await session.run(resetAssessmentQuery, {
        workerId: VON_WORKER_ID,
        assessmentId: VON_ASSESSMENT_ID,
      });
    } finally {
      await session.close();
    }
  }

  async getRecommendations(): Promise<RecommendationResponse> {
    const assessment = await this.getAssessment();
    if (!assessment) throw new AssessmentNotFoundError();

    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result = await session.run(recommendationCandidatesQuery, {
        workerId: VON_WORKER_ID,
        completedProgramId: CYPRESS_MANDELA_PROGRAM_ID,
      });
      const recommendations = result.records
        .map(recommendationCandidateFromRecord)
        .map((candidate) => toGraphRecommendation(candidate, assessment))
        .sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

      return {
        assessment,
        stages: [
          {
            id: 'assessment',
            label: 'Read current intake selections',
            detail: 'Loaded the saved public-safe assessment from Neo4j.',
          },
          {
            id: 'graph',
            label: 'Trace evidence paths',
            detail: 'Read existing worker, skill, match, source, and provider relationships from Neo4j.',
          },
          {
            id: 'ranking',
            label: 'Rank eligible connections',
            detail: 'Applied transparent deterministic priority rules; urgency changes ordering, not eligibility.',
          },
        ],
        recommendations,
        bridgePlan: buildGraphBridgePlan(recommendations),
      };
    } finally {
      await session.close();
    }
  }

  close(): Promise<void> {
    return this.driver.close();
  }

  private async getAssessment(): Promise<DemoAssessment | null> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result = await session.run(`
        MATCH (:Worker {worker_id: $workerId})-[:HAS_CURRENT_ASSESSMENT]->(assessment:Assessment {assessment_id: $assessmentId})
        RETURN
          assessment.assessment_id AS assessment_id,
          assessment.worker_id AS worker_id,
          assessment.preferred_counties AS preferred_counties,
          assessment.availability AS availability,
          assessment.financial_urgency AS financial_urgency,
          assessment.work_priority AS work_priority,
          assessment.trade_level AS trade_level,
          assessment.trade_experience AS trade_experience,
          assessment.certifications AS certifications,
          assessment.updated_at AS updated_at
      `, {
        workerId: VON_WORKER_ID,
        assessmentId: VON_ASSESSMENT_ID,
      });
      return result.records[0] ? assessmentFromRecord(result.records[0]) : null;
    } finally {
      await session.close();
    }
  }
}

export async function createNeo4jGraphReader(): Promise<Neo4jGraphReader> {
  const driver = neo4j.driver(
    requiredEnvironment('NEO4J_URI'),
    neo4j.auth.basic(
      requiredEnvironment('NEO4J_USERNAME'),
      requiredEnvironment('NEO4J_PASSWORD'),
    ),
  );

  try {
    await driver.verifyConnectivity();
    return new Neo4jGraphReader(driver, process.env.NEO4J_DATABASE || 'neo4j');
  } catch (error) {
    await driver.close();
    throw error;
  }
}

function assessmentFromRecord(record: { get(key: string): unknown }): DemoAssessment | null {
  const assessmentId = record.get('assessment_id');
  if (typeof assessmentId !== 'string' || !assessmentId) return null;

  return {
    assessmentId,
    workerId: requiredString(record, 'worker_id'),
    preferredCounties: stringArray(record.get('preferred_counties')) as DemoAssessment['preferredCounties'],
    availability: requiredString(record, 'availability') as DemoAssessment['availability'],
    financialUrgency: requiredString(record, 'financial_urgency') as DemoAssessment['financialUrgency'],
    workPriority: requiredString(record, 'work_priority') as DemoAssessment['workPriority'],
    tradeLevel: requiredString(record, 'trade_level') as DemoAssessment['tradeLevel'],
    tradeExperience: stringArray(record.get('trade_experience')) as DemoAssessment['tradeExperience'],
    certifications: stringArray(record.get('certifications')) as DemoAssessment['certifications'],
    updatedAt: requiredString(record, 'updated_at'),
  };
}

function recommendationCandidateFromRecord(record: { get(key: string): unknown }): GraphRecommendationCandidate {
  const targetType = requiredString(record, 'target_type');
  const tier = requiredString(record, 'tier');
  if ((targetType !== 'Program' && targetType !== 'Opportunity') || !isRecommendationTier(tier)) {
    throw new Error('Neo4j returned an invalid recommendation record.');
  }

  return {
    id: requiredString(record, 'id'),
    workerName: requiredString(record, 'worker_name'),
    targetType,
    tier,
    title: targetType === 'Program'
      ? requiredString(record, 'program_name')
      : requiredString(record, 'opportunity_title'),
    organization: requiredString(record, 'organization'),
    county: requiredString(record, 'county'),
    city: requiredString(record, 'city'),
    status: requiredString(record, 'status'),
    externalUrl: requiredString(record, 'external_url'),
    sourceName: requiredString(record, 'source_name'),
    sourceUrl: requiredString(record, 'source_url'),
    graphSummary: 'This connection is grounded in Von’s public-safe skill evidence and an existing graph match.',
    requirementsToConfirm: requiredString(record, 'requirements_to_confirm'),
    graphEvidence: stringArray(record.get('graphEvidence')),
    tradeCategories: optionalString(record, 'trade_categories'),
    preferredCertifications: optionalString(record, 'preferred_certifications'),
    experienceLevelText: optionalString(record, 'experience_level_text'),
  };
}

function isRecommendationTier(value: string): value is GraphRecommendationCandidate['tier'] {
  return value === 'strong_pathway_match' || value === 'transferable_skills_match' || value === 'future_demand_signal';
}

function splitValues(value: string): string[] {
  return value.split(';').map((item) => item.trim()).filter(Boolean);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function requiredString(record: { get(key: string): unknown }, key: string): string {
  const value = record.get(key);
  if (typeof value !== 'string' || !value) {
    throw new Error(`Neo4j returned an invalid ${key} value.`);
  }
  return value;
}

function optionalString(record: { get(key: string): unknown }, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required ${name} configuration.`);
  }
  return value;
}
