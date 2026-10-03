"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivateSequence } from "@/components/ActivateSequence";
import { ActivationMap } from "@/components/ActivationMap";
import { api } from "@/lib/utils";
import type { MapPayload, PropertyDetail } from "@/lib/types";

type Step = {
  id: number;
  kicker: string;
  title: string;
  body?: string;
  context?: { text: string }[];
  trades?: string[];
  needs?: { label: string; need: number; available: number }[];
  gap?: number;
  gap_label?: string;
  covered?: string;
  shortage?: string;
  note?: string;
  gap_text?: string;
  asbestos?: string;
  environmental_extract?: string;
  summary?: string;
  label?: string;
  banner?: string;
  asks?: { who: string; text: string }[];
  close?: string;
  units?: number;
  hours?: number;
  property_ids?: string[];
  official_planning_capacity?: number | null;
};

type DemoPayload = {
  steps: Step[];
  focus: {
    property_id: string;
    longitude: number;
    latitude: number;
    official_planning_capacity: number | null;
    modeled_units: number;
  };
  scenario_property_ids: string[];
  citywide_units: number;
  workforce_total: number;
  block_check: { properties: number; units: number; hours: number };
};

const CITY = { center: [-122.25, 37.8] as [number, number], zoom: 11.5 };
const SCENARIO_VIEW = { center: [-122.23, 37.79] as [number, number], zoom: 11.8 };

export default function DemoPage() {
  const [demo, setDemo] = useState<DemoPayload | null>(null);
  const [mapPayload, setMapPayload] = useState<MapPayload | null>(null);
  const [activate, setActivate] = useState<PropertyDetail["activate"] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DemoPayload>("/demo").then(setDemo).catch((reason: Error) => setError(reason.message));
    api<MapPayload>("/map").then(setMapPayload).catch(() => undefined);
    api<PropertyDetail>("/properties/BB-001").then((property) => setActivate(property.activate)).catch(() => undefined);
  }, []);

  const stepCount = demo?.steps.length ?? 0;
  const advance = useCallback(() => {
    setIndex((current) => Math.min(stepCount - 1, current + 1));
  }, [stepCount]);
  const back = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.key === "ArrowRight" || event.code === "Space") {
        event.preventDefault();
        advance();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIndex(0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  const step = demo?.steps[index];
  const showMap = step?.id === 1 || step?.id === 2 || step?.id === 6;
  const flyTo = useMemo(() => {
    if (!demo || !step) return CITY;
    if (step.id === 2) return { center: [demo.focus.longitude, demo.focus.latitude] as [number, number], zoom: 15.4 };
    if (step.id === 6) return SCENARIO_VIEW;
    return CITY;
  }, [demo, step]);
  const highlightIds = step?.id === 2 && demo ? [demo.focus.property_id] : step?.id === 6 ? step.property_ids || demo?.scenario_property_ids || [] : [];

  if (error) {
    return <main className="grid h-screen place-items-center bg-ink p-10 text-paper"><p className="max-w-lg text-2xl">Judge mode needs the local API. Start it with make demo, then refresh.</p></main>;
  }
  if (!demo || !step) return <main className="grid h-screen place-items-center bg-ink text-2xl text-steel">Loading judge mode…</main>;

  return (
    <main data-step={step.id} className="fixed inset-0 z-40 flex flex-col bg-ink text-paper">
      <header className="flex items-center justify-between px-8 pt-4 text-sm uppercase tracking-[0.2em] text-steel">
        <span>BenchBridge</span>
        <span data-progress="true">{index + 1} / {demo.steps.length}</span>
      </header>
      <div className={`grid min-h-0 flex-1 ${showMap ? "grid-cols-1 lg:grid-cols-[minmax(420px,0.85fr)_1.15fr]" : "grid-cols-1"}`}>
        <section className={`flex min-h-0 flex-col overflow-y-auto bg-ink px-8 py-4 md:px-12 ${step.id === 7 ? "justify-start" : "justify-center"}`}>
          <AnimatePresence mode="wait">
            <motion.div key={step.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <p className="text-sm uppercase tracking-[0.22em] text-orange">{step.kicker}</p>
              <h1 className={`mt-3 max-w-4xl font-display uppercase leading-[0.95] text-paper ${step.title.length > 48 ? "text-4xl md:text-5xl" : "text-5xl md:text-6xl xl:text-7xl"}`}>{step.title}</h1>
              {step.body && <p className="mt-5 max-w-2xl text-2xl leading-snug text-paper/90">{step.body}</p>}
              {step.id === 2 && (
                <p className="mt-4 max-w-xl text-lg text-steel">Housing Element planning capacity {demo.focus.official_planning_capacity ?? "—"}. That public figure is not these modeled units.</p>
              )}
              {step.trades && <p className="mt-8 font-display text-3xl uppercase tracking-wide md:text-4xl">{step.trades.join(" · ")}</p>}
              {step.needs && (
                <div className="mt-8 max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.18em] text-warn">Demo workforce data</p>
                  <p className="mt-3 font-display text-4xl uppercase text-ok">{step.covered}</p>
                  {step.needs.map((need) => (
                    <div key={need.label} className="mt-2 grid grid-cols-[1fr_auto] gap-8 border-b border-line py-2 text-2xl">
                      <span>{need.need} {need.label.toLowerCase()} required</span>
                      <span className="whitespace-nowrap">{need.available} demo available</span>
                    </div>
                  ))}
                  <p className="mt-6 font-display text-4xl uppercase text-block">{step.shortage}</p>
                  <p className="mt-2 text-3xl">Environmental specialist shortage {step.gap}</p>
                  <p className="mt-3 text-lg text-steel">{step.note}</p>
                </div>
              )}
              {step.gap_text && <p className="mt-6 font-display text-5xl uppercase">{step.gap_text}</p>}
              {step.asbestos && <p className="mt-4 text-2xl">{step.asbestos}</p>}
              {step.environmental_extract && <p className="mt-2 max-w-xl text-lg text-steel">{step.environmental_extract}</p>}
              {step.id === 5 && activate && (
                <div className="mt-6 max-w-3xl">
                  <ActivateSequence steps={activate.steps} disclaimer={activate.disclaimer} benefitsLabel={activate.who_benefits_label} benefits={activate.who_benefits} paceMs={420} />
                </div>
              )}
              {step.summary && <p className="mt-6 font-display text-4xl uppercase leading-tight">{step.summary}</p>}
              {step.label && <p className="mt-4 text-xl uppercase tracking-[0.14em] text-warn">{step.label}</p>}
              {step.id === 7 && (
                <div className="mt-4 max-w-xl text-xl leading-snug">
                  <p>Participating union / hiring hall</p>
                  <p className="text-orange">↓</p>
                  <p>Authorized aggregate availability</p>
                  <p className="text-orange">↓</p>
                  <p>BenchBridge</p>
                  <p className="text-orange">↓</p>
                  <p>Project demand signal</p>
                  <p className="text-orange">↓</p>
                  <p>Existing dispatch process</p>
                  <p className="mt-4 text-lg text-steel">Counts below 5 are hidden to protect worker privacy. No individual workers. Dispatch stays with the hall.</p>
                </div>
              )}
              {step.banner && <p className="mt-4 max-w-2xl border border-warn px-4 py-2 text-lg text-warn">{step.banner}</p>}
              {step.asks && (
                <ol className="mt-4 max-w-2xl space-y-2 text-lg">
                  {step.asks.map((ask) => <li key={ask.who}><span className="text-orange">{ask.who}, voluntary. </span>{ask.text}</li>)}
                </ol>
              )}
              {step.close && <p className="mt-8 font-display text-4xl uppercase text-orange md:text-5xl">{step.close}</p>}
            </motion.div>
          </AnimatePresence>
        </section>
        {showMap && mapPayload && (
          <section className="relative min-h-[320px] overflow-hidden border-l border-line">
            <ActivationMap
              payload={mapPayload}
              selectedId={step.id === 2 ? demo.focus.property_id : null}
              highlightIds={highlightIds}
              showCity={false}
              showHousing={false}
              showPipeline={false}
              showNeighborhoods={step.id !== 2}
              showEnvironmental={false}
              flyTo={flyTo}
              onSelect={() => undefined}
            />
          </section>
        )}
      </div>
      <footer className="relative z-30 flex items-center justify-between gap-6 bg-ink px-8 pb-4 pt-3 text-sm uppercase tracking-[0.16em] text-steel">
        <span>Space or right arrow advances · left arrow back · escape restarts</span>
        <span className="flex gap-2">
          <button className="border border-line px-3 py-2 text-paper" onClick={back}>Back</button>
          <button className="border border-orange px-3 py-2 text-orange" onClick={advance}>Next</button>
        </span>
      </footer>
    </main>
  );
}
