import { describe, expect, it } from 'vitest';
import { DataLoadError, getPublicDemoWorker, loadBenchBridgeSeed } from './seed';

describe('public-safe seed loader', () => {
  it('accepts only Von as the single public-safe demo worker', () => {
    const seed = loadBenchBridgeSeed();

    expect(seed.workers).toHaveLength(1);
    expect(seed.workers[0]).toMatchObject({
      worker_id: 'WORKER-DEMO-001',
      display_name: 'Von',
      privacy_mode: 'public_safe',
      profile_type: 'real_person_demo_public_safe',
      home_county: 'not_provided',
    });
  });

  it('returns a restricted public worker projection', () => {
    const worker = getPublicDemoWorker();

    expect(worker).toMatchObject({
      workerId: 'WORKER-DEMO-001',
      displayName: 'Von',
      homeCounty: 'not_provided',
      privacyMode: 'public_safe',
    });
    expect(worker).not.toHaveProperty('source_id');
    expect(worker).not.toHaveProperty('legal_name');
    expect(worker).not.toHaveProperty('email');
    expect(worker).not.toHaveProperty('phone');
    expect(worker).not.toHaveProperty('address');
  });

  it('rejects seeds that violate the public-safe worker contract', () => {
    const invalidSeed = structuredClone(loadBenchBridgeSeed());
    invalidSeed.workers[0].home_county = 'San Francisco';

    expect(() => loadBenchBridgeSeed(invalidSeed)).toThrow(DataLoadError);
  });

  it('rejects seeds that contain more than one worker', () => {
    const invalidSeed = structuredClone(loadBenchBridgeSeed());
    invalidSeed.workers.push(structuredClone(invalidSeed.workers[0]));

    expect(() => loadBenchBridgeSeed(invalidSeed)).toThrow('exactly one worker');
  });
});
