import { describe, expect, it } from 'vitest';
import { graphEdgeFromRecord, type GraphRecord, vonGraphQuery } from './graph.js';

function record(values: Record<string, unknown>): GraphRecord {
  return { get: (key) => values[key] };
}

describe('graphEdgeFromRecord', () => {
  it('maps a Neo4j graph record into the public graph shape', () => {
    expect(graphEdgeFromRecord(record({
      from_id: 'WORKER-DEMO-001',
      from_type: 'Worker',
      relationship: 'HAS_SKILL',
      to_id: 'SKILL-SAFETY',
      to_type: 'Skill',
      evidence_source_id: 'SRC-VON-RESUME',
      confidence: 'high',
      notes: 'Public-safe profile evidence.',
      from_label: 'Von',
      to_label: 'Safety',
    }))).toEqual({
      from_id: 'WORKER-DEMO-001',
      from_type: 'Worker',
      relationship: 'HAS_SKILL',
      to_id: 'SKILL-SAFETY',
      to_type: 'Skill',
      evidence_source_id: 'SRC-VON-RESUME',
      confidence: 'high',
      notes: 'Public-safe profile evidence.',
      fromLabel: 'Von',
      toLabel: 'Safety',
    });
  });

  it('rejects graph records with unknown node labels', () => {
    expect(() => graphEdgeFromRecord(record({
      from_id: 'WORKER-DEMO-001',
      from_type: 'Worker',
      relationship: 'HAS_SKILL',
      to_id: 'SKILL-SAFETY',
      to_type: 'Unrecognized',
      evidence_source_id: 'SRC-VON-RESUME',
      confidence: 'high',
      notes: '',
      from_label: 'Von',
      to_label: 'Safety',
    }))).toThrow('unsupported entity type');
  });

  it('selects canonical IDs by entity label', () => {
    expect(vonGraphQuery).toContain('WHEN relationshipStart:Skill THEN relationshipStart.skill_id');
    expect(vonGraphQuery).toContain('WHEN relationshipEnd:Opportunity THEN relationshipEnd.opportunity_id');
  });
});
