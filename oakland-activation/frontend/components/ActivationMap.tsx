"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type FilterSpecification, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapPayload } from "@/lib/types";

const BLOCKER_COLOR: Record<string, string> = {
  ENVIRONMENTAL_REMEDIATION: "#c44736",
  ENVIRONMENTAL_REVIEW: "#c44736",
  FUNDING_GAP: "#d89a2b",
  SPECIALIZED_WORKFORCE_GAP: "#e15a1c",
  PLANNING_REVIEW: "#9aa196",
  ASSESSMENT_NEEDED: "#d89a2b",
  READY_FOR_FURTHER_EVALUATION: "#2f8f55",
  REHABILITATION_UNDERWAY: "#3d9a62",
  ACTIVATED: "#2f8f55",
};

type Props = {
  payload: MapPayload;
  selectedId?: string | null;
  highlightIds?: string[];
  showCity: boolean;
  showHousing: boolean;
  showPipeline: boolean;
  showNeighborhoods: boolean;
  showEnvironmental: boolean;
  flyTo?: { center: [number, number]; zoom: number } | null;
  onSelect: (id: string) => void;
};

export function ActivationMap(props: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelect = useRef(props.onSelect);
  const lastFly = useRef("");
  const markers = useRef<maplibregl.Marker[]>([]);
  onSelect.current = props.onSelect;

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#171b18" } }],
      },
      center: [-122.25, 37.8],
      zoom: 12.2,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      map.addSource("boundary", { type: "geojson", data: props.payload.boundary });
      map.addSource("neighborhoods", { type: "geojson", data: props.payload.neighborhoods });
      map.addSource("streets", { type: "geojson", data: props.payload.streets });
      map.addSource("city", { type: "geojson", data: props.payload.city_owned });
      map.addSource("housing", { type: "geojson", data: props.payload.housing_element });
      map.addSource("candidates", { type: "geojson", data: props.payload.candidates });
      map.addSource("points", { type: "geojson", data: pointsFrom(props.payload) });
      map.addLayer({ id: "boundary-fill", type: "fill", source: "boundary", paint: { "fill-color": "#222823", "fill-opacity": 0.9 } });
      map.addLayer({ id: "boundary-line", type: "line", source: "boundary", paint: { "line-color": "#d9d3c5", "line-width": 1.2 } });
      map.addLayer({ id: "neighborhoods", type: "fill", source: "neighborhoods", paint: { "fill-color": "#2c3830", "fill-opacity": 0.35 }, layout: { visibility: "visible" } });
      map.addLayer({ id: "neighborhoods-line", type: "line", source: "neighborhoods", paint: { "line-color": "#667066", "line-width": 1, "line-dasharray": [2, 2] } });
      map.addLayer({ id: "streets", type: "line", source: "streets", paint: { "line-color": "#3e4740", "line-width": 1.4 } });
      map.addLayer({ id: "city", type: "fill", source: "city", paint: { "fill-color": "#8aa0b4", "fill-opacity": 0.28 }, layout: { visibility: "none" } });
      map.addLayer({ id: "city-line", type: "line", source: "city", paint: { "line-color": "#c5d4e2", "line-width": 0.6 }, layout: { visibility: "none" } });
      map.addLayer({ id: "housing", type: "line", source: "housing", paint: { "line-color": "#e15a1c", "line-width": 1, "line-opacity": 0.7 }, layout: { visibility: "visible" } });
      map.addLayer({
        id: "pipeline",
        type: "fill",
        source: "housing",
        filter: ["in", "Pipeline", ["coalesce", ["get", "STATUS"], ""]],
        paint: { "fill-color": "#e15a1c", "fill-opacity": 0.18 },
        layout: { visibility: "none" },
      });
      const colorExpr = ["match", ["get", "primary_blocker"], ...Object.entries(BLOCKER_COLOR).flat(), "#f4f0e6"] as unknown;
      map.addLayer({ id: "candidates", type: "fill", source: "candidates", paint: { "fill-color": colorExpr as never, "fill-opacity": 0.78 } });
      map.addLayer({ id: "candidates-line", type: "line", source: "candidates", paint: { "line-color": "#f4f0e6", "line-width": 0.8 } });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 7,
          "circle-color": colorExpr as never,
          "circle-stroke-color": "#f4f0e6",
          "circle-stroke-width": 1,
        },
      });
      map.addLayer({
        id: "selected",
        type: "line",
        source: "candidates",
        filter: ["==", ["get", "property_id"], ""],
        paint: { "line-color": "#f4f0e6", "line-width": 3 },
      });
      map.addLayer({
        id: "points-selected",
        type: "circle",
        source: "points",
        filter: ["==", ["get", "property_id"], ""],
        paint: { "circle-radius": 16, "circle-color": "#f4f0e6", "circle-opacity": 0.15, "circle-stroke-color": "#f4f0e6", "circle-stroke-width": 3 },
      });
      const selectFrom = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const id = event.features?.[0]?.properties?.property_id;
        if (id) onSelect.current(String(id));
      };
      map.on("click", "candidates", selectFrom);
      map.on("click", "points", selectFrom);
      map.on("mouseenter", "candidates", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseenter", "points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "candidates", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseleave", "points", () => {
        map.getCanvas().style.cursor = "";
      });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once. Data updates go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getSource("candidates")) return;
    (map.getSource("candidates") as GeoJSONSource | undefined)?.setData(props.payload.candidates);
    (map.getSource("points") as GeoJSONSource | undefined)?.setData(pointsFrom(props.payload));
    (map.getSource("city") as GeoJSONSource | undefined)?.setData(props.payload.city_owned);
    (map.getSource("housing") as GeoJSONSource | undefined)?.setData(props.payload.housing_element);
    const ids = props.highlightIds?.length ? props.highlightIds : props.selectedId ? [props.selectedId] : [];
    const filter = ids.length ? ["in", ["get", "property_id"], ["literal", ids]] : ["==", ["get", "property_id"], ""];
    if (map.getLayer("selected")) map.setFilter("selected", filter as FilterSpecification);
    if (map.getLayer("points-selected")) map.setFilter("points-selected", filter as FilterSpecification);
    const vis = (id: string, on: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    };
    vis("city", props.showCity);
    vis("city-line", props.showCity);
    vis("housing", props.showHousing);
    vis("pipeline", props.showPipeline);
    vis("neighborhoods", props.showNeighborhoods);
    vis("neighborhoods-line", props.showNeighborhoods);
    map.resize();
    const flyKey = props.flyTo ? `${props.flyTo.zoom}:${props.flyTo.center.join(",")}` : "";
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (ids.length && ids.length <= 3) {
      const features = pointsFrom(props.payload).features;
      ids.forEach((id) => {
        const feature = features.find((item) => item.properties?.property_id === id);
        if (!feature) return;
        const el = document.createElement("div");
        el.textContent = id;
        el.style.cssText = "background:#f4f0e6;color:#141816;font:700 14px sans-serif;padding:4px 8px;border-radius:2px;letter-spacing:0.04em";
        const coords = feature.geometry.coordinates as [number, number];
        markers.current.push(new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, -16] }).setLngLat(coords).addTo(map));
      });
    }
    if (props.flyTo && flyKey !== lastFly.current) {
      lastFly.current = flyKey;
      map.flyTo({ center: props.flyTo.center, zoom: props.flyTo.zoom, essential: true, duration: 1400 });
    }
    };
    if (map.isStyleLoaded() && map.getSource("candidates")) apply();
    else map.once("idle", apply);
  }, [props]);

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" />
      <ul className="pointer-events-none absolute bottom-20 left-3 z-10 space-y-1.5 rounded border border-line bg-ink/95 px-3 py-2 text-sm text-paper">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LEGEND = [
  { color: "#e15a1c", label: "Orange · specialist gap" },
  { color: "#d89a2b", label: "Yellow · funding or assessment" },
  { color: "#2f8f55", label: "Green · ready or underway" },
  { color: "#9aa196", label: "Grey · planning review" },
  { color: "#c44736", label: "Red · environmental" },
];

function pointsFrom(payload: MapPayload) {
  return {
    type: "FeatureCollection" as const,
    features: payload.properties.map((property) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [property.longitude, property.latitude] },
      properties: { property_id: property.property_id, primary_blocker: property.primary_blocker },
    })),
  };
}
