"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, formatNumber } from "@/lib/utils";

type Catalog = { label: string; scenarios: { id: string; prompt: string; property_id?: string }[] };

export default function ScenarioPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api<Catalog>("/scenarios").then(setCatalog);
  }, []);

  async function run(item: Catalog["scenarios"][number]) {
    const body = await api<Record<string, unknown>>("/scenarios/run", {
      method: "POST",
      body: JSON.stringify({ scenario_id: item.id, property_id: item.property_id }),
    });
    setResult(body);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="font-display text-5xl uppercase">What if</h1>
      <p className="mt-2 text-sm text-steel">{catalog?.label}</p>
      <div className="mt-4 flex flex-col gap-2">
        {catalog?.scenarios.map((item) => (
          <Button key={item.id} variant="ghost" className="justify-start" onClick={() => run(item)}>{item.prompt}</Button>
        ))}
      </div>
      {result && (
        <section className="mt-6 border border-line p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={String(result.source_status || "DEMO")} />
            <span>{String(result.label || result.description || "")}</span>
          </div>
          {"affected_count" in result && (
            <p className="font-display text-3xl uppercase">
              {formatNumber(Number(result.affected_count))} projects · {formatNumber(Number(result.potential_units))} potential units · {formatNumber(Number(result.estimated_worker_hours))} worker-hours · {formatNumber(Number(result.neighborhood_count))} neighborhoods
            </p>
          )}
          {"property_count" in result && !("affected_count" in result) && (
            <p>{formatNumber(Number(result.property_count))} properties · {formatNumber(Number(result.potential_units || 0))} potential units</p>
          )}
          {"remaining_blockers" in result && <pre className="mt-3 whitespace-pre-wrap text-xs text-steel">{JSON.stringify(result.remaining_blockers, null, 2)}</pre>}
          {"projects" in result && <pre className="mt-3 whitespace-pre-wrap text-xs text-steel">{JSON.stringify(result.projects, null, 2)}</pre>}
          {"supply" in result && <pre className="mt-3 whitespace-pre-wrap text-xs text-steel">{JSON.stringify(result.supply, null, 2)}</pre>}
          <p className="mt-3 text-xs text-warn">Scenario comparison — not a funding recommendation or project approval. Baseline records are not changed.</p>
        </section>
      )}
    </main>
  );
}
