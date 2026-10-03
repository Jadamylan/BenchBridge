"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivationMap } from "@/components/ActivationMap";
import { BuildingPanel } from "@/components/BuildingPanel";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, formatNumber } from "@/lib/utils";
import type { Blocker, ContextStat, MapPayload, PropertyDetail } from "@/lib/types";

const ACTIVATION: { id: Blocker; label: string }[] = [
  { id: "FUNDING_GAP", label: "Funding blocked" },
  { id: "ENVIRONMENTAL_REVIEW", label: "Environmental review" },
  { id: "ENVIRONMENTAL_REMEDIATION", label: "Environmental remediation" },
  { id: "SPECIALIZED_WORKFORCE_GAP", label: "Specialized workforce gap" },
  { id: "PLANNING_REVIEW", label: "Planning / permitting" },
  { id: "ASSESSMENT_NEEDED", label: "Assessment needed" },
  { id: "READY_FOR_FURTHER_EVALUATION", label: "Ready for further evaluation" },
  { id: "REHABILITATION_UNDERWAY", label: "Rehabilitation underway" },
  { id: "ACTIVATED", label: "Activated" },
];

export default function MapPage() {
  const [active, setActive] = useState<Blocker[]>(ACTIVATION.map((item) => item.id));
  const [showCity, setShowCity] = useState(false);
  const [showHousing, setShowHousing] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showEnvironmental, setShowEnvironmental] = useState(false);
  const [showCandidates, setShowCandidates] = useState(true);
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [stats, setStats] = useState<Record<string, ContextStat> | null>(null);
  const [selected, setSelected] = useState<PropertyDetail | null>(null);
  const [block, setBlock] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bottlenecks, setBottlenecks] = useState<{ group: string; count: number; percent: number; property_ids: string[] }[]>([]);
  const [highlight, setHighlight] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (showCandidates && active.length) active.forEach((item) => params.append("blocker", item));
    else params.append("blocker", "NONE");
    api<MapPayload>(`/map?${params.toString()}`)
      .then(setPayload)
      .catch((reason: Error) => setError(reason.message));
  }, [active, showCandidates]);

  useEffect(() => {
    api<{ stats: Record<string, ContextStat> }>("/context-stats").then((body) => setStats(body.stats)).catch(() => undefined);
    api<{ groups: { group: string; count: number; percent: number; property_ids: string[] }[] }>("/bottlenecks").then((body) => setBottlenecks(body.groups)).catch(() => undefined);
  }, []);

  async function openProperty(id: string) {
    const detail = await api<PropertyDetail>(`/properties/${id}`);
    setSelected(detail);
    setHighlight([id]);
  }

  const flyTo = useMemo(() => {
    if (!selected) return null;
    return { center: [selected.longitude, selected.latitude] as [number, number], zoom: 15 };
  }, [selected]);

  function toggle(id: Blocker) {
    setActive((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main className="grid h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_420px]">
      <aside className="overflow-y-auto border-r border-line bg-ink p-4">
        <p className="text-xs leading-relaxed text-steel">Buildings are waiting. Workers are waiting. People are waiting for housing.</p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-steel">Property</p>
        <Toggle label="Candidate rehabilitation opportunities" on={showCandidates} set={setShowCandidates} />
        <Toggle label="City-owned property" on={showCity} set={setShowCity} />
        <Toggle label="Housing Element opportunity sites" on={showHousing} set={setShowHousing} />
        <Toggle label="Pipeline status in the inventory" on={showPipeline} set={setShowPipeline} />
        <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-steel">Conditions</p>
        <Toggle label="Environmental / cleanup records" on={showEnvironmental} set={setShowEnvironmental} />
        <Toggle label="Neighborhood navigation boxes" on={showNeighborhoods} set={setShowNeighborhoods} />
        <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-steel">Activation</p>
        {ACTIVATION.map((item) => (
          <Toggle key={item.id} label={item.label} on={active.includes(item.id)} set={() => toggle(item.id)} />
        ))}
        <Button className="mt-4 w-full" variant="ghost" onClick={() => api<Record<string, unknown>>("/blocks/west-oakland-7th").then((body) => { setBlock(body); setHighlight((body.property_ids as string[]) || []); })}>Unlock the block</Button>
        {showEnvironmental && payload && <p className="mt-3 text-xs text-steel">{payload.environmental_note}</p>}
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">System bottleneck map <StatusBadge status="DEMO" /></p>
          {bottlenecks.map((group) => (
            <button key={group.group} className="mt-1 flex w-full justify-between text-left text-xs hover:text-orange" onClick={() => setHighlight(group.property_ids)}>
              <span className="uppercase">{group.group.replaceAll("_", " ")}</span>
              <span>{group.count} · {group.percent}%</span>
            </button>
          ))}
        </div>
      </aside>
      <section className="relative min-h-[60vh]">
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap gap-3">
          <Counter label="Housing capacity" value={payload ? formatNumber(payload.capacity.potential_units) : "—"} unit="potential units represented" status={payload?.capacity.potential_units_source || "DEMO"} />
          <Counter label="Workforce capacity" value={payload ? formatNumber(payload.capacity.workforce_workers) : "—"} unit="demo workers across required trades" status="DEMO" note={payload?.capacity.workforce_note} />
        </div>
        {error && <p className="absolute inset-x-0 top-24 z-10 mx-auto max-w-lg border border-block bg-ink p-3 text-sm">The map API is not reachable. Start it with DEMO_MODE=true from the benchbridge folder.</p>}
        {payload && (
          <ActivationMap
            payload={payload}
            selectedId={selected?.property_id}
            highlightIds={highlight}
            showCity={showCity}
            showHousing={showHousing}
            showPipeline={showPipeline}
            showNeighborhoods={showNeighborhoods}
            showEnvironmental={showEnvironmental}
            flyTo={flyTo}
            onSelect={openProperty}
          />
        )}
        <ContextStrip stats={stats} />
        {block && (
          <div className="absolute bottom-24 left-3 z-10 max-w-sm border border-orange bg-ink/95 p-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-orange">Unlock the block · West Oakland</p>
            <p>{String(block.property_count)} candidates · {formatNumber(Number(block.potential_units))} potential units · {formatNumber(Number(block.estimated_worker_hours))} estimated worker-hours</p>
            <p className="text-xs text-steel">{JSON.stringify(block.blocker_counts)}</p>
            <p className="text-xs text-warn">{String(block.label || "")}</p>
          </div>
        )}
      </section>
      {selected && (
        <div className="hidden xl:block">
          <BuildingPanel property={selected} onClose={() => setSelected(null)} />
        </div>
      )}
      {selected && (
        <div className="fixed inset-y-0 right-0 z-20 w-full max-w-md xl:hidden">
          <BuildingPanel property={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </main>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (value: boolean) => void }) {
  return (
    <label className="mt-1 flex items-start gap-2 text-xs">
      <input type="checkbox" checked={on} onChange={(event) => set(event.target.checked)} className="mt-0.5 accent-orange" />
      <span>{label}</span>
    </label>
  );
}

function Counter({ label, value, unit, status, note }: { label: string; value: string; unit: string; status: string; note?: string }) {
  return (
    <div className="pointer-events-auto border border-line bg-ink/90 px-3 py-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-steel">{label}</p>
        <StatusBadge status={status} />
      </div>
      <p className="font-display text-4xl leading-none">{value}</p>
      <p className="text-[11px] text-steel">{unit}</p>
      {note && <p className="max-w-xs text-[10px] text-warn">{note}</p>}
    </div>
  );
}

function ContextStrip({ stats }: { stats: Record<string, ContextStat> | null }) {
  if (!stats) return null;
  const order = ["pit_oakland_2026", "pit_oakland_share", "pit_oakland_unsheltered", "ca_construction_employment", "alameda_unemployment"];
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex gap-4 overflow-x-auto border-t border-line bg-ink/95 px-3 py-2 text-[11px]">
      {order.map((id) => {
        const stat = stats[id];
        if (!stat) return null;
        const value = id === "ca_construction_employment" && stat.year_over_change !== undefined
          ? `${formatNumber(Number(stat.value))} jobs · ${formatNumber(stat.year_over_change)} year over year`
          : id === "alameda_unemployment"
            ? `${stat.value}%`
            : formatNumber(Number(stat.value)) === "NaN" ? String(stat.value) : typeof stat.value === "number" ? formatNumber(stat.value) : String(stat.value);
        return (
          <a key={id} href={stat.source_url} className="min-w-56 shrink-0">
            <span className="text-paper">{value}</span>{" "}
            <StatusBadge status={stat.status} />{" "}
            {!stat.verified && <span className="text-warn">unverified</span>}
            <span className="block text-steel">{stat.caveat}</span>
          </a>
        );
      })}
    </div>
  );
}
