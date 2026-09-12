import { ApiGraphRepository } from '../adapters/api/ApiGraphRepository';
import { localRepositories } from '../data/repositories/localRepositories';
import { LocalBridgePlanService, LocalMatchingService } from '../services/localServices';

const matching = new LocalMatchingService(
  localRepositories.opportunities,
  localRepositories.programs,
  localRepositories.organizations,
  localRepositories.sources,
);

export const demoRuntime = {
  repositories: { ...localRepositories, graph: new ApiGraphRepository() },
  matching,
  explanations: matching,
  bridgePlan: new LocalBridgePlanService(matching, localRepositories.events, localRepositories.sources),
};
