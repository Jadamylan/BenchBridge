"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/utils";

export default function MethodologyPage() {
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    api<{ markdown: string }>("/methodology").then((body) => setMarkdown(body.markdown));
  }, []);
  return (
    <main className="mx-auto max-w-3xl p-6">
      {markdown.split("\n").map((line, index) => {
        if (line.startsWith("# ")) return <h1 key={index} className="font-display text-5xl uppercase">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={index} className="mt-8 font-display text-2xl uppercase">{line.slice(3)}</h2>;
        if (line.startsWith("- ")) return <p key={index} className="mt-2 pl-4 text-sm leading-relaxed">• {line.slice(2)}</p>;
        if (!line.trim()) return <div key={index} className="h-2" />;
        return <p key={index} className="mt-2 text-sm leading-relaxed text-paper/90">{line}</p>;
      })}
    </main>
  );
}
