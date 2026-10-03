"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivateSequence } from "@/components/ActivateSequence";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { PropertyDetail } from "@/lib/types";

export function BuildingPanel({ property, onClose }: { property: PropertyDetail; onClose?: () => void }) {
  const [crewOpen, setCrewOpen] = useState(false);
  const [activate, setActivate] = useState(false);
  const hours = property.tasks.reduce((sum, task) => sum + task.estimated_worker_hours, 0);
  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-line bg-panel text-paper">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-panel px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-orange">{property.property_id} · {property.neighborhood}</p>
          <h2 className="font-display text-3xl uppercase leading-none">{property.address}</h2>
        </div>
        {onClose && <button className="text-xs uppercase tracking-widest text-steel" onClick={onClose}>Close</button>}
      </div>
      <div className="space-y-5 px-4 py-4 text-sm">
        <section>
          <Header label="Potential housing" status={property.potential_units_source} />
          <p className="font-display text-5xl leading-none">{formatNumber(property.candidate_potential_units)} <span className="text-2xl text-steel">modeled units</span></p>
          <p className="mt-2 text-steel">Official Housing Element projected capacity: {property.housing_element_capacity ?? "not in extract"} <StatusBadge status="PUBLIC" /></p>
          <p className="mt-1 text-xs text-steel">{property.approval_note}</p>
        </section>

        <section>
          <Header label="Rehabilitation" status="DEMO" />
          <p className="text-warn">{property.modeled_disclaimer}</p>
          <p className="mt-2">{property.work_package_count} work packages · {formatNumber(hours)} estimated worker-hours</p>
          <ul className="mt-2 space-y-2">
            {property.tasks.map((task) => (
              <li key={task.rehab_scenario_id} className="border border-line px-2 py-2">
                <div className="flex justify-between gap-3">
                  <span>{task.task}</span>
                  <StatusBadge status="DEMO" />
                </div>
                <p className="text-xs text-steel">{task.category} · {task.estimated_workers} workers · {formatNumber(task.estimated_worker_hours)} hours · {formatMoney(task.estimated_cost)}{task.specialist_required ? " · specialist crew" : ""}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Header label="Trades required" status="DEMO" />
          <ul>
            {property.crew.lines.map((line) => (
              <li key={line.trade} className="flex justify-between border-b border-line py-1">
                <span>{line.label}</span>
                <span>{line.needed_workers}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-wrap gap-2">
          <Button onClick={() => setCrewOpen(true)}>Build the crew</Button>
          <Button variant="ghost" onClick={() => setActivate(true)}>Activate</Button>
          <Button variant="ghost" asChild><Link href={`/building/${property.property_id}`}>Full record</Link></Button>
        </section>

        {crewOpen && (
          <section className="border border-warn/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-warn">Build the crew</p>
              <StatusBadge status="DEMO" />
            </div>
            <p className="text-xs text-steel">{property.crew.real_bench_note}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-steel">
              <span>Project need</span><span>Demo supply</span>
            </div>
            {property.crew.lines.map((line) => (
              <div key={line.trade} className="grid grid-cols-2 border-b border-line py-1">
                <span>{line.needed_workers} {line.label.toLowerCase()}</span>
                <span>{line.demo_available} available {line.gap < 0 ? "⚠" : "✓"}</span>
              </div>
            ))}
            {property.crew.shortages.map((gap) => (
              <p key={gap.label} className="mt-3 font-display text-2xl uppercase text-block">Workforce gap: {gap.label} {gap.gap}</p>
            ))}
            <p className="mt-2 text-xs">{property.crew.label}</p>
            <p className="text-xs text-steel">{property.crew.dispatch_note}</p>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-steel">Contractors</p>
            <p className="text-xs text-warn">{property.crew.contractor_note}</p>
            <ul className="mt-2 space-y-1">
              {property.crew.contractors.map((firm) => (
                <li key={firm.license_number} className="text-xs">
                  {firm.business_name} · {firm.classification} · {firm.city} · {firm.license_number} · Union status: {firm.union_status}
                </li>
              ))}
            </ul>
          </section>
        )}

        {activate && (
          <ActivateSequence
            steps={property.activate.steps}
            disclaimer={property.activate.disclaimer}
            benefitsLabel={property.activate.who_benefits_label}
            benefits={property.activate.who_benefits}
          />
        )}

        <section>
          <Header label="Funding" status="DEMO" />
          <p>Estimated rehab cost {formatMoney(property.estimated_cost)}</p>
          <p>Identified funds {formatMoney(property.identified_funds)}</p>
          <p className="font-display text-3xl">Remaining modeled gap {formatMoney(property.modeled_funding_gap)}</p>
        </section>

        <section>
          <Header label="Primary modeled blocker" status="DEMO" />
          <p className="font-display text-3xl uppercase">{property.primary_blocker.replaceAll("_", " ")}</p>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Building record</p>
          <p>Year built: {property.year_built ?? "Unknown"}</p>
          <p>{property.asbestos_note}</p>
          <p>Environmental records: {property.environmental_status}</p>
          <p>Use description: {property.building_type ?? "Unknown"}</p>
          <p>Floor area: {property.building_sqft ? formatNumber(property.building_sqft) : "Unknown"}</p>
          <p>Existing units in extract: {property.existing_units ?? "Unknown"}</p>
          <p className="text-xs text-steel">{property.vacancy_note}</p>
        </section>

        <section>
          <Header label="Planning signals" status="PUBLIC" />
          <p>Zoning code: {property.zoning ?? "not in cached extract"}</p>
          <p>General plan code: {property.general_plan_code ?? "not in cached extract"}</p>
          <p>Historic status: {property.historic_status ?? "UNKNOWN"}</p>
          <p className="text-xs text-steel">Not a legal zoning determination.</p>
          <p className="mt-2 text-xs">Inventory status: {property.housing_element_status}. Site type: {property.housing_element_type}.</p>
          <p className="text-xs text-steel">Income-category capacity in the inventory — very low {property.housing_element_vlow ?? "—"}, low {property.housing_element_low ?? "—"}, moderate {property.housing_element_mod ?? "—"}, above moderate {property.housing_element_amod ?? "—"}.</p>
        </section>

        <section>
          <Header label="County assessed value" status={property.county_parcels.length ? "PUBLIC" : "PARTNER_REQUIRED"} />
          {property.county_parcels.length === 0 && <p>No cached county parcel matched this situs.</p>}
          {property.county_parcels.map((parcel) => (
            <p key={parcel.apn} className="text-xs">APN {parcel.apn} · use code {parcel.use_code} · land {formatMoney(parcel.land_value)} · improvements {formatMoney(parcel.improvement_value)} · net {formatMoney(parcel.assessed_value)}. A zero may be an exemption, not a market value.</p>
          ))}
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Wage requirements</p>
          <p>{property.wage_notice}</p>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Why is this here?</p>
          <p>{property.why_here}</p>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Sources and assumptions</p>
          <ul className="space-y-2">
            {property.sources.map((source) => (
              <li key={source.field} className="flex items-start justify-between gap-3">
                <span>{source.field}</span>
                <StatusBadge status={source.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function Header({ label, status }: { label: string; status: string }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-[0.16em] text-steel">{label}</p>
      <StatusBadge status={status} />
    </div>
  );
}
