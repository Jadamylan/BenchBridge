"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatusBadge } from "@/components/ui/badge";
import { api } from "@/lib/utils";
import type { ContextStat } from "@/lib/types";

type Row = { trade: string; label: string; classification: string; count: number | null; display: string; suppressed: boolean; as_of: string; source_status: string };
type ChartRow = { label: string; bench_count: number | null; bench_display: string; suppressed: boolean; demanded_hours: number; demanded_workers: number };

export default function WorkforcePage() {
  const [body, setBody] = useState<{
    banner: string | null;
    message?: string;
    real_bench_note: string;
    rows: Row[];
    chart: ChartRow[];
    controls: string[];
    participation_metrics: string;
    contract: { fields: string[]; suppression: string; excluded: string[] };
    status: string;
  } | null>(null);
  const [stats, setStats] = useState<Record<string, ContextStat> | null>(null);

  useEffect(() => {
    api<NonNullable<typeof body>>("/workforce").then(setBody);
    api<{ stats: Record<string, ContextStat> }>("/context-stats").then((payload) => setStats(payload.stats));
  }, []);

  if (!body) return <p className="p-6 text-sm text-steel">Loading the bench board…</p>;
  const hours = body.chart.map((row) => ({ label: row.label, hours: row.demanded_hours }));
  const bench = body.chart.filter((row) => !row.suppressed).map((row) => ({ label: row.label, count: row.bench_count }));

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section>
        {body.banner && <p className="border border-warn bg-ink px-3 py-2 text-sm text-warn">{body.banner}</p>}
        {body.message && <p className="mt-3 text-lg">{body.message}</p>}
        <div className="mt-4 flex items-center gap-2">
          <h1 className="font-display text-5xl uppercase">Bench board</h1>
          <StatusBadge status={body.status === "DEMO" ? "DEMO" : "PARTNER_REQUIRED"} />
        </div>
        <p className="mt-2 text-sm text-steel">{body.real_bench_note}</p>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-steel">
            <tr><th>Trade</th><th>Class</th><th>Count</th><th>As of</th><th>Source</th></tr>
          </thead>
          <tbody>
            {body.rows.map((row) => (
              <tr key={row.trade} className="border-t border-line">
                <td className="py-2">{row.label}</td>
                <td>{row.classification}</td>
                <td>{row.display}</td>
                <td>{row.as_of.slice(0, 10)}</td>
                <td><StatusBadge status={row.source_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="mt-8 font-display text-2xl uppercase">Demand vs bench</h2>
        <p className="text-xs text-steel">Modeled worker-hours and demo bench counts are different units. Suppressed cells are omitted from the count chart and shown as &lt;5 in the table.</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours}>
              <XAxis dataKey="label" tick={{ fill: "#9aa196", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9aa196", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#e15a1c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bench}>
              <XAxis dataKey="label" tick={{ fill: "#9aa196", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9aa196", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f4f0e6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="border border-line p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Public context</p>
          {stats && ["ca_construction_employment", "alameda_unemployment", "sf_trades_survey_2023"].map((id) => {
            const stat = stats[id];
            return (
              <p key={id} className="mt-3 text-sm">
                <a className="underline" href={stat.source_url}>{stat.source_name}</a>
                <span className="mt-1 block text-paper">{String(stat.value)}{stat.year_over_change !== undefined ? ` · year over year ${stat.year_over_change}` : ""}</span>
                <StatusBadge status={stat.status} /> {!stat.verified && <span className="text-warn">unverified</span>}
                <span className="mt-1 block text-xs text-steel">{stat.caveat}</span>
              </p>
            );
          })}
        </section>
        <section className="border border-line p-4 text-sm">
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Data contract</p>
          <p className="mt-2">{body.contract.fields.join(", ")}</p>
          <p className="mt-2 text-steel">{body.contract.suppression}</p>
          <p className="mt-2">Not shared: {body.contract.excluded.join(", ")}.</p>
          <p className="mt-3">Participation metrics: {body.participation_metrics}</p>
        </section>
        <section className="border border-line p-4 text-sm">
          <p className="text-[10px] uppercase tracking-[0.16em] text-steel">What a participating local controls</p>
          <ul className="mt-2 list-disc pl-4">
            {body.controls.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </aside>
    </main>
  );
}
