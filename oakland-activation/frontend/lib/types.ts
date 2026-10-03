export type Blocker =
  | "ENVIRONMENTAL_REMEDIATION"
  | "ENVIRONMENTAL_REVIEW"
  | "FUNDING_GAP"
  | "SPECIALIZED_WORKFORCE_GAP"
  | "PLANNING_REVIEW"
  | "ASSESSMENT_NEEDED"
  | "READY_FOR_FURTHER_EVALUATION"
  | "REHABILITATION_UNDERWAY"
  | "ACTIVATED";

export type Capacity = {
  property_count: number;
  potential_units: number;
  potential_units_source: string;
  workforce_workers: number;
  workforce_source: string;
  workforce_note: string;
};

export type FeatureCollection = { type: "FeatureCollection"; features: GeoJSON.Feature[] };

export type MapPayload = {
  capacity: Capacity;
  candidates: FeatureCollection;
  city_owned: FeatureCollection;
  housing_element: FeatureCollection;
  neighborhoods: FeatureCollection;
  boundary: FeatureCollection;
  streets: FeatureCollection;
  blocks: FeatureCollection;
  environmental_note: string;
  basemap: string;
  properties: PropertySummary[];
};

export type PropertySummary = {
  property_id: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  primary_blocker: Blocker;
  candidate_potential_units: number;
  potential_units_source: string;
  housing_element_capacity: number | null;
  estimated_worker_hours: number;
  modeled_funding_gap: number;
  year_built: number | null;
  asbestos_status: string;
};

export type Task = {
  rehab_scenario_id: string;
  task: string;
  trade: string;
  category: string;
  estimated_workers: number;
  estimated_worker_hours: number;
  estimated_cost: number;
  specialist_required: boolean;
  source_type: string;
};

export type PropertyDetail = PropertySummary & {
  apn: string | null;
  building_type: string | null;
  building_sqft: number | null;
  existing_units: number | null;
  zoning: string | null;
  general_plan_code: string | null;
  historic_status: string | null;
  environmental_status: string;
  housing_element_status: string | null;
  housing_element_type: string | null;
  housing_element_vlow: number | null;
  housing_element_low: number | null;
  housing_element_mod: number | null;
  housing_element_amod: number | null;
  ownership_type: string;
  work_package_count: number;
  estimated_cost: number;
  identified_funds: number;
  tasks: Task[];
  county_parcels: { apn: string; use_code: string; land_value: number; improvement_value: number; assessed_value: number }[];
  why_here: string;
  sources: { field: string; status: string; source_id: string }[];
  modeled_disclaimer: string;
  asbestos_note: string;
  approval_note: string;
  vacancy_note: string;
  wage_notice: string;
  crew: Crew;
  activate: { disclaimer: string; steps: { key: string; title: string; detail: string }[]; who_benefits_label: string; who_benefits: { who: string; line: string }[] };
};

export type Crew = {
  label: string;
  dispatch_note: string;
  real_bench_note: string;
  source_status: string;
  lines: { trade: string; label: string; needed_workers: number; demo_available: number; gap: number; source_status: string }[];
  shortages: { label: string; gap: number }[];
  contractors: { business_name: string; license_number: string; classification: string; city: string; union_status: string; endorsement: string }[];
  contractor_note: string;
};

export type ContextStat = {
  value: number | string;
  prior_value?: number | null;
  year_over_change?: number;
  affordable_housing_authorization?: number;
  unsheltered?: number;
  unit?: string;
  as_of: string;
  source_name: string;
  source_url: string;
  retrieved_at: string;
  status: string;
  verified: boolean;
  caveat: string;
  include_in_judge_mode?: boolean;
};
