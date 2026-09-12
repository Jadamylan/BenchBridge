import type { AIService } from '../../domain/services';
import type { BridgePlanAction } from '../../domain/types';

export class UnavailableAIServiceAdapter implements AIService {
  async generateBridgePlan(): Promise<BridgePlanAction[]> {
    throw new Error('AI service is not connected. Qoder must implement a grounded AI adapter.');
  }
}
