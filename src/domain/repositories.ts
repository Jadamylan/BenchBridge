import type {
  Certification,
  Experience,
  GraphEdgeView,
  Organization,
  Opportunity,
  Program,
  PublicWorker,
  Skill,
  Source,
  WorkforceEvent,
} from './types';

export interface WorkerRepository {
  getDemoWorker(): PublicWorker;
  getExperience(workerId: string): Experience[];
  getSkills(workerId: string): Skill[];
  getCertifications(workerId: string): Certification[];
}

export interface OpportunityRepository {
  getById(opportunityId: string): Opportunity | undefined;
  list(includeExpired?: boolean): Opportunity[];
}

export interface ProgramRepository {
  getById(programId: string): Program | undefined;
  list(): Program[];
}

export interface OrganizationRepository {
  getById(organizationId: string): Organization | undefined;
  list(): Organization[];
}

export interface EventRepository {
  list(includePast?: boolean): WorkforceEvent[];
}

export interface GraphRepository {
  getVonRelationships(): Promise<GraphEdgeView[]>;
}

export interface SourceRepository {
  getById(sourceId: string): Source | undefined;
}
