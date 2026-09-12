import type { EntityType, GraphEdgeView } from '../src/domain/types.js';

export const VON_WORKER_ID = 'WORKER-DEMO-001';

const entityTypes = new Set<EntityType>([
  'Worker',
  'Skill',
  'Certification',
  'Experience',
  'Organization',
  'Program',
  'Opportunity',
  'Event',
  'Source',
]);

export const vonGraphQuery = `
  MATCH (worker:Worker {worker_id: $workerId})
  MATCH (worker)-[]-(directNode)
  WITH worker, collect(DISTINCT directNode) + [worker] AS scopeNodes
  UNWIND scopeNodes AS fromNode
  MATCH (fromNode)-[relationship]-(toNode)
  WHERE toNode IN scopeNodes
  WITH DISTINCT relationship, startNode(relationship) AS relationshipStart, endNode(relationship) AS relationshipEnd
  RETURN
    CASE
      WHEN relationshipStart:Worker THEN relationshipStart.worker_id
      WHEN relationshipStart:Certification THEN relationshipStart.cert_id
      WHEN relationshipStart:Skill THEN relationshipStart.skill_id
      WHEN relationshipStart:Experience THEN relationshipStart.experience_id
      WHEN relationshipStart:Organization THEN relationshipStart.org_id
      WHEN relationshipStart:Program THEN relationshipStart.program_id
      WHEN relationshipStart:Event THEN relationshipStart.event_id
      WHEN relationshipStart:Opportunity THEN relationshipStart.opportunity_id
      WHEN relationshipStart:Source THEN relationshipStart.source_id
    END AS from_id,
    head(labels(relationshipStart)) AS from_type,
    coalesce(
      relationshipStart.display_name,
      relationshipStart.name,
      relationshipStart.role_title,
      relationshipStart.certification_name,
      relationshipStart.skill_name,
      relationshipStart.title
    ) AS from_label,
    type(relationship) AS relationship,
    CASE
      WHEN relationshipEnd:Worker THEN relationshipEnd.worker_id
      WHEN relationshipEnd:Certification THEN relationshipEnd.cert_id
      WHEN relationshipEnd:Skill THEN relationshipEnd.skill_id
      WHEN relationshipEnd:Experience THEN relationshipEnd.experience_id
      WHEN relationshipEnd:Organization THEN relationshipEnd.org_id
      WHEN relationshipEnd:Program THEN relationshipEnd.program_id
      WHEN relationshipEnd:Event THEN relationshipEnd.event_id
      WHEN relationshipEnd:Opportunity THEN relationshipEnd.opportunity_id
      WHEN relationshipEnd:Source THEN relationshipEnd.source_id
    END AS to_id,
    head(labels(relationshipEnd)) AS to_type,
    coalesce(
      relationshipEnd.display_name,
      relationshipEnd.name,
      relationshipEnd.role_title,
      relationshipEnd.certification_name,
      relationshipEnd.skill_name,
      relationshipEnd.title
    ) AS to_label,
    relationship.evidence_source_id AS evidence_source_id,
    relationship.confidence AS confidence,
    relationship.notes AS notes
  ORDER BY from_label, relationship, to_label
`;

export interface GraphRecord {
  get(key: string): unknown;
}

export function graphEdgeFromRecord(record: GraphRecord): GraphEdgeView {
  return {
    from_id: requiredString(record, 'from_id'),
    from_type: entityType(record, 'from_type'),
    relationship: requiredString(record, 'relationship'),
    to_id: requiredString(record, 'to_id'),
    to_type: entityType(record, 'to_type'),
    evidence_source_id: requiredString(record, 'evidence_source_id'),
    confidence: requiredString(record, 'confidence'),
    notes: optionalString(record, 'notes'),
    fromLabel: requiredString(record, 'from_label'),
    toLabel: requiredString(record, 'to_label'),
  };
}

function entityType(record: GraphRecord, key: string): EntityType {
  const value = requiredString(record, key);
  if (!entityTypes.has(value as EntityType)) {
    throw new Error(`Neo4j returned an unsupported entity type for ${key}.`);
  }
  return value as EntityType;
}

function requiredString(record: GraphRecord, key: string): string {
  const value = record.get(key);
  if (typeof value !== 'string' || !value) {
    throw new Error(`Neo4j returned an invalid ${key} value.`);
  }
  return value;
}

function optionalString(record: GraphRecord, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}
