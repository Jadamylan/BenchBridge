"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BuildingPanel } from "@/components/BuildingPanel";
import { api } from "@/lib/utils";
import type { PropertyDetail } from "@/lib/types";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!params.id) return;
    api<PropertyDetail>(`/properties/${params.id}`).then(setProperty).catch((reason: Error) => setError(reason.message));
  }, [params.id]);
  if (error) return <p className="p-6 text-sm">{error}</p>;
  if (!property) return <p className="p-6 text-sm text-steel">Loading the building record…</p>;
  return (
    <main className="mx-auto max-w-3xl">
      <BuildingPanel property={property} />
    </main>
  );
}
