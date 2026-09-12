import { describe, expect, it } from 'vitest';
import { demoRuntime } from '../app/runtime';
import { isCypressMandela, requiresProviderConfirmation, statusLabel } from '../domain/status';

describe('local deterministic matching', () => {
  it('excludes requirements gaps and future demand from best matches', () => {
    const bestMatches = demoRuntime.matching.getBestMatches();

    expect(bestMatches).not.toHaveLength(0);
    expect(bestMatches.every((match) => match.tier === 'strong_pathway_match' || match.tier === 'transferable_skills_match')).toBe(true);
    expect(bestMatches.some((match) => match.tier === 'requirements_gap')).toBe(false);
    expect(bestMatches.some((match) => match.tier === 'future_demand_signal')).toBe(false);
  });

  it('keeps requirements gaps visible only as transparent information', () => {
    const gaps = demoRuntime.matching.filterMatches({ tier: 'requirements_gap' });

    expect(gaps).not.toHaveLength(0);
    expect(gaps.every((match) => match.eligibilityState === 'likely_not_qualified_from_resume')).toBe(true);
  });

  it('filters matches by county and preserves all returned records in that county', () => {
    const matches = demoRuntime.matching.filterMatches({ county: 'San Francisco' });

    expect(matches).not.toHaveLength(0);
    expect(matches.every((match) => match.target.county === 'San Francisco')).toBe(true);
  });

  it('hides expired opportunities by default and returns them only when requested', () => {
    const current = demoRuntime.repositories.opportunities.list();
    const all = demoRuntime.repositories.opportunities.list(true);
    const archived = all.filter((opportunity) => opportunity.status === 'expired');

    expect(archived).not.toHaveLength(0);
    expect(current.some((opportunity) => opportunity.status === 'expired')).toBe(false);
    expect(all).toHaveLength(current.length + archived.length);
  });

  it('maps uncertain status to an explicit provider-confirmation label', () => {
    expect(requiresProviderConfirmation('verify_program_intake')).toBe(true);
    expect(statusLabel('verify_program_intake')).toBe('Confirm with provider');
  });

  it('keeps Cypress Mandela in completed history, not best-match recommendations', () => {
    const completedTraining = demoRuntime.repositories.workers
      .getExperience('WORKER-DEMO-001')
      .find((experience) => experience.experience_type === 'mc3_pre_apprenticeship');

    expect(completedTraining?.end_date).toBe('2025-09');
    expect(demoRuntime.repositories.programs.list().some(isCypressMandela)).toBe(true);
    expect(demoRuntime.matching.getBestMatches().some((match) => match.target.id === 'PRG-CYPRESS-PA')).toBe(false);
  });

  it('links every bridge-plan action to an existing source record', () => {
    const actions = demoRuntime.bridgePlan.buildPlan();

    expect(actions).toHaveLength(6);
    expect(actions.map((action) => action.priority)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const action of actions) {
      expect(demoRuntime.repositories.sources.getById(action.source.source_id)).toEqual(action.source);
    }
  });
});
