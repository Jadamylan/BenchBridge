export type MatchTier =
  | 'strong_pathway_match'
  | 'transferable_skills_match'
  | 'future_demand_signal'
  | 'requirements_gap';

export type EntityType =
  | 'Worker'
  | 'Skill'
  | 'Certification'
  | 'Experience'
  | 'Organization'
  | 'Program'
  | 'Opportunity'
  | 'Event'
  | 'Source';

export interface Worker {
  worker_id: string;
  display_name: string;
  profile_type: string;
  privacy_mode: string;
  current_region: string;
  home_county: string;
  preferred_counties: string;
  availability: string;
  employment_status: string;
  primary_trade_family: string;
  experience_summary: string;
  target_roles: string;
  licenses: string;
  military_status: string;
  training_summary: string;
  source_id: string;
  verified_as_of: string;
}

export interface PublicWorker {
  workerId: string;
  displayName: string;
  profileType: string;
  privacyMode: string;
  currentRegion: string;
  homeCounty: string;
  preferredCounties: string[];
  availability: string;
  employmentStatus: string;
  tradeFamilies: string[];
  experienceSummary: string;
  targetRoles: string[];
  licenses: string[];
  militaryStatus: string;
  trainingSummary: string;
  verifiedAsOf: string;
}

export interface Experience {
  experience_id: string;
  worker_id: string;
  employer_org_id: string;
  role_title: string;
  location: string;
  start_date: string;
  end_date: string;
  experience_type: string;
  key_evidence: string;
  source_id: string;
  notes: string;
}

export interface Certification {
  cert_id: string;
  worker_id: string;
  certification_name: string;
  issuer: string;
  status: string;
  valid_through: string;
  evidence: string;
  source_id: string;
  notes: string;
}

export interface Skill {
  worker_id: string;
  skill_id: string;
  skill_name: string;
  skill_category: string;
  evidence: string;
  proficiency_signal: string;
  source_id: string;
}

export interface Organization {
  org_id: string;
  name: string;
  org_type: string;
  county: string;
  city: string;
  website: string;
  services: string;
  priority: string;
  verified_as_of: string;
  source_id: string;
  notes: string;
}

export interface Program {
  program_id: string;
  name: string;
  provider_org_id: string;
  program_type: string;
  trade_categories: string;
  county: string;
  city: string;
  delivery: string;
  eligibility: string;
  duration: string;
  application_status: string;
  next_date: string;
  application_url: string;
  verified_as_of: string;
  status_confidence: string;
  source_id: string;
  notes: string;
}

export interface Opportunity {
  opportunity_id: string;
  title: string;
  opportunity_type: 'job' | 'project_demand_signal';
  employer_or_agency: string;
  org_id: string;
  county: string;
  city: string;
  status: string;
  posted_date: string;
  deadline: string;
  salary_or_value: string;
  trade_categories: string;
  experience_level: string;
  apply_url: string;
  source_id: string;
  verified_as_of: string;
  confidence: string;
  notes: string;
}

export interface WorkforceEvent {
  event_id: string;
  name: string;
  host_org_id: string;
  event_type: string;
  start_date: string;
  start_time: string;
  end_date: string;
  city: string;
  county: string;
  location: string;
  registration_url: string;
  eligibility: string;
  trade_categories: string;
  status: string;
  verified_as_of: string;
  source_id: string;
  notes: string;
}

export interface Source {
  source_id: string;
  name: string;
  source_type: string;
  primary_url: string;
  refresh_cadence: string;
  last_verified: string;
  confidence: string;
  notes: string;
}

export interface MatchExample {
  match_id: string;
  worker_id: string;
  target_id: string;
  target_type: 'Program' | 'Opportunity';
  match_tier: MatchTier;
  eligibility_state: string;
  score: number;
  matched_evidence: string;
  requirements_gap: string;
  recommended_action: string;
  source_id: string;
}

export interface GraphRelationship {
  from_id: string;
  from_type: EntityType;
  relationship: string;
  to_id: string;
  to_type: EntityType;
  evidence_source_id: string;
  confidence: string;
  notes: string;
}

export interface SeedData {
  metadata: { as_of: string };
  workers: Worker[];
  worker_certifications: Certification[];
  worker_experience: Experience[];
  worker_skills: Skill[];
  worker_match_examples: MatchExample[];
  organizations: Organization[];
  programs: Program[];
  events: WorkforceEvent[];
  opportunities: Opportunity[];
  sources: Source[];
  relationships: GraphRelationship[];
}

export interface MatchTarget {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  county: string;
  city: string;
  status: string;
  deadlineOrDate: string;
  trade: string;
  experienceLevel: string;
  externalUrl: string;
  sourceId: string;
  verifiedAsOf: string;
  isProjectDemand: boolean;
}

export interface MatchResult {
  id: string;
  tier: MatchTier;
  score: number;
  eligibilityState: string;
  evidence: string;
  requirementsGap: string;
  recommendedAction: string;
  target: MatchTarget;
  source: Source;
}

export interface BridgePlanAction {
  id: string;
  priority: number;
  category: 'pathway' | 'lead_to_verify' | 'event' | 'future_demand' | 'confirm' | 'next_step';
  title: string;
  detail: string;
  action: string;
  source: Source;
  deadlineOrDate?: string;
}

export interface GraphEdgeView extends GraphRelationship {
  fromLabel: string;
  toLabel: string;
}

export interface MatchFilters {
  county?: string;
  city?: string;
  trade?: string;
  opportunityType?: string;
  status?: string;
  date?: string;
  experienceLevel?: string;
  tier?: MatchTier | '';
  includeExpired?: boolean;
}
