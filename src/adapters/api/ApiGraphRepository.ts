import type { GraphRepository } from '../../domain/repositories';
import type { EntityType, GraphEdgeView } from '../../domain/types';

export class ApiGraphRepository implements GraphRepository {
  async getVonRelationships(): Promise<GraphEdgeView[]> {
    const response = await fetch('/api/graph/von', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('The relationship graph is temporarily unavailable.');
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error('The relationship graph response is invalid.');
    }

    return payload.map(graphEdgeFromPayload);
  }
}

function graphEdgeFromPayload(value: unknown): GraphEdgeView {
  if (!value || typeof value !== 'object') {
    throw new Error('The relationship graph response is invalid.');
  }

  const edge = value as Record<string, unknown>;
  return {
    from_id: requiredString(edge, 'from_id'),
    from_type: requiredString(edge, 'from_type') as EntityType,
    relationship: requiredString(edge, 'relationship'),
    to_id: requiredString(edge, 'to_id'),
    to_type: requiredString(edge, 'to_type') as EntityType,
    evidence_source_id: requiredString(edge, 'evidence_source_id'),
    confidence: requiredString(edge, 'confidence'),
    notes: requiredString(edge, 'notes'),
    fromLabel: requiredString(edge, 'fromLabel'),
    toLabel: requiredString(edge, 'toLabel'),
  };
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const property = value[key];
  if (typeof property !== 'string') {
    throw new Error('The relationship graph response is invalid.');
  }
  return property;
}
