import type {
  DemoAssessment,
  DemoAssessmentInput,
  GraphBridgePlanAction,
  GraphRecommendation,
  IntakePrefill,
  RecommendationResponse,
  RecommendationStage,
} from '../../domain/types';

export class ApiIntakeRepository {
  async getPrefill(): Promise<IntakePrefill> {
    return request('/api/intake/von', { method: 'GET' }) as Promise<IntakePrefill>;
  }

  async saveAssessment(input: DemoAssessmentInput): Promise<DemoAssessment> {
    return request('/api/intake/von/assessment', {
      method: 'PUT',
      body: JSON.stringify(input),
    }) as Promise<DemoAssessment>;
  }

  async getRecommendations(): Promise<RecommendationResponse> {
    return request('/api/recommendations/von', { method: 'POST' }) as Promise<RecommendationResponse>;
  }

  async resetAssessment(): Promise<void> {
    await request('/api/intake/von/assessment', { method: 'DELETE' });
  }
}

async function request(path: string, options: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'The intake service is temporarily unavailable.';
    throw new Error(message);
  }

  if (response.status === 204) return undefined;
  return validatePayload(path, payload);
}

function validatePayload(path: string, payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    throw new Error('The intake service returned an invalid response.');
  }
  if (path === '/api/intake/von' && !('profile' in payload && 'demoAnswers' in payload && 'assessment' in payload)) {
    throw new Error('The intake service returned an invalid response.');
  }
  if (path === '/api/recommendations/von' && !('assessment' in payload && 'stages' in payload && 'recommendations' in payload && 'bridgePlan' in payload)) {
    throw new Error('The recommendation service returned an invalid response.');
  }
  return payload;
}

export type { DemoAssessment, DemoAssessmentInput, GraphBridgePlanAction, GraphRecommendation, IntakePrefill, RecommendationResponse, RecommendationStage };
