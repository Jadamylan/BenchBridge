import rawSeed from '../../data/benchbridge_seed.json';
import type { PublicWorker, SeedData, Worker } from '../domain/types';

export class DataLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataLoadError';
  }
}

function splitValues(value: string): string[] {
  return value.split(';').map((item) => item.trim()).filter(Boolean);
}

function toPublicWorker(worker: Worker): PublicWorker {
  return {
    workerId: worker.worker_id,
    displayName: worker.display_name,
    profileType: worker.profile_type,
    privacyMode: worker.privacy_mode,
    currentRegion: worker.current_region,
    homeCounty: worker.home_county,
    preferredCounties: splitValues(worker.preferred_counties),
    availability: worker.availability,
    employmentStatus: worker.employment_status,
    tradeFamilies: splitValues(worker.primary_trade_family),
    experienceSummary: worker.experience_summary,
    targetRoles: splitValues(worker.target_roles),
    licenses: splitValues(worker.licenses),
    militaryStatus: worker.military_status,
    trainingSummary: worker.training_summary,
    verifiedAsOf: worker.verified_as_of,
  };
}

export function loadBenchBridgeSeed(payload: unknown = rawSeed): SeedData {
  const seed = payload as SeedData;
  if (!seed || !Array.isArray(seed.workers) || !Array.isArray(seed.relationships)) {
    throw new DataLoadError('BenchBridge local data could not be loaded.');
  }
  if (seed.workers.length !== 1) {
    throw new DataLoadError('The public demo must contain exactly one worker.');
  }

  const [worker] = seed.workers;
  if (
    worker.worker_id !== 'WORKER-DEMO-001' ||
    worker.display_name !== 'Von' ||
    worker.privacy_mode !== 'public_safe' ||
    worker.profile_type !== 'real_person_demo_public_safe' ||
    worker.home_county !== 'not_provided'
  ) {
    throw new DataLoadError('The local worker does not meet the public-safe demo contract.');
  }

  return seed;
}

export function getPublicDemoWorker(seed = loadBenchBridgeSeed()): PublicWorker {
  return toPublicWorker(seed.workers[0]);
}
