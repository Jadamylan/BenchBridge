"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/ui/badge";

type Step = { key: string; title: string; detail: string };

export function ActivateSequence({
  steps,
  disclaimer,
  benefitsLabel,
  benefits,
  paceMs = 650,
}: {
  steps: Step[];
  disclaimer: string;
  benefitsLabel: string;
  benefits: { who: string; line: string }[];
  paceMs?: number;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index >= steps.length - 1) return;
    const timer = window.setTimeout(() => setIndex((value) => value + 1), paceMs);
    return () => window.clearTimeout(timer);
  }, [index, steps.length, paceMs]);
  const step = steps[index];
  const done = index === steps.length - 1;
  return (
    <div className="border border-line bg-ink p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-steel">Building → work → workers → barrier → housing</p>
        <StatusBadge status="DEMO" />
      </div>
      <div className="min-h-28">
        <AnimatePresence mode="wait">
          <motion.div key={step.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
            <p className="font-display text-4xl uppercase leading-none text-paper">{step.title}</p>
            <p className="mt-2 text-sm text-steel">{step.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1">
        {steps.map((item, itemIndex) => (
          <span key={item.key} className={`h-1 flex-1 ${itemIndex <= index ? "bg-orange" : "bg-line"}`} />
        ))}
      </div>
      {done && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-warn">{benefitsLabel}</p>
          <ul className="mt-2 grid gap-1 text-sm">
            {benefits.map((item) => (
              <li key={item.who}>
                <span className="text-paper">{item.who}. </span>
                <span className="text-steel">{item.line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-warn">{disclaimer}</p>
    </div>
  );
}
