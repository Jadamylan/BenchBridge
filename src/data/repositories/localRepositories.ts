import { getPublicDemoWorker, loadBenchBridgeSeed } from '../seed';
import type {
  EventRepository,
  GraphRepository,
  OpportunityRepository,
  OrganizationRepository,
  ProgramRepository,
  SourceRepository,
  WorkerRepository,
} from '../../domain/repositories';
import type {
  Certification,
  Experience,
  GraphEdgeView,
  Organization,
  Opportunity,
  Program,
  Skill,
  Source,
  WorkforceEvent,
} from '../../domain/types';
import { isPastEvent } from '../../domain/status';

const seed = loadBenchBridgeSeed();

function byId<T>(items: T[], getId: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [getId(item), item]));
}

const organizations = byId(seed.organizations, (item) => item.org_id);
const programs = byId(seed.programs, (item) => item.program_id);
const opportunities = byId(seed.opportunities, (item) => item.opportunity_id);
const sources = byId(seed.sources, (item) => item.source_id);
const events = byId(seed.events, (item) => item.event_id);
const certifications = byId(seed.worker_certifications, (item) => item.cert_id);
const skills = byId(seed.worker_skills, (item) => item.skill_id);
const experience = byId(seed.worker_experience, (item) => item.experience_id);

function labelFor(entityId: string): string {
  if (entityId === 'WORKER-DEMO-001') return 'Von';
  return (
    organizations.get(entityId)?.name ??
    programs.get(entityId)?.name ??
    opportunities.get(entityId)?.title ??
    events.get(entityId)?.name ??
    certifications.get(entityId)?.certification_name ??
    skills.get(entityId)?.skill_name ??
    experience.get(entityId)?.role_title ??
    sources.get(entityId)?.name ??
    entityId
  );
}

export class LocalWorkerRepository implements WorkerRepository {
  getDemoWorker() {
    return getPublicDemoWorker(seed);
  }

  getExperience(workerId: string): Experience[] {
    return seed.worker_experience.filter((item) => item.worker_id === workerId);
  }

  getSkills(workerId: string): Skill[] {
    return seed.worker_skills.filter((item) => item.worker_id === workerId);
  }

  getCertifications(workerId: string): Certification[] {
    return seed.worker_certifications.filter((item) => item.worker_id === workerId);
  }
}

export class LocalOpportunityRepository implements OpportunityRepository {
  getById(opportunityId: string): Opportunity | undefined {
    return opportunities.get(opportunityId);
  }

  list(includeExpired = false): Opportunity[] {
    return seed.opportunities.filter((item) => includeExpired || item.status !== 'expired');
  }
}

export class LocalProgramRepository implements ProgramRepository {
  getById(programId: string): Program | undefined {
    return programs.get(programId);
  }

  list(): Program[] {
    return seed.programs;
  }
}

export class LocalOrganizationRepository implements OrganizationRepository {
  getById(organizationId: string): Organization | undefined {
    return organizations.get(organizationId);
  }

  list(): Organization[] {
    return seed.organizations;
  }
}

export class LocalEventRepository implements EventRepository {
  list(includePast = false): WorkforceEvent[] {
    return seed.events
      .filter((item) => includePast || !isPastEvent(item))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }
}

export class LocalSourceRepository implements SourceRepository {
  getById(sourceId: string): Source | undefined {
    return sources.get(sourceId);
  }
}

export class LocalGraphRepository implements GraphRepository {
  async getVonRelationships(): Promise<GraphEdgeView[]> {
    const directEdges = seed.relationships.filter(
      (edge) => edge.from_id === 'WORKER-DEMO-001' || edge.to_id === 'WORKER-DEMO-001',
    );
    const directIds = new Set(directEdges.flatMap((edge) => [edge.from_id, edge.to_id]));
    const graphEdges = seed.relationships.filter(
      (edge) =>
        directEdges.includes(edge) ||
        (directIds.has(edge.from_id) && directIds.has(edge.to_id)),
    );

    return graphEdges.map((edge) => ({
      ...edge,
      fromLabel: labelFor(edge.from_id),
      toLabel: labelFor(edge.to_id),
    }));
  }
}

export const localRepositories = {
  workers: new LocalWorkerRepository(),
  opportunities: new LocalOpportunityRepository(),
  programs: new LocalProgramRepository(),
  organizations: new LocalOrganizationRepository(),
  events: new LocalEventRepository(),
  graph: new LocalGraphRepository(),
  sources: new LocalSourceRepository(),
};
