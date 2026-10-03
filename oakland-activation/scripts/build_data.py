"""Normalize cached public extracts and demo seed into Parquet + GeoJSON.

Reads only local files. Does not call the network.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from candidate_seed import CANDIDATES, DEMO_CONTRACTORS, WORKFORCE  # noqa: E402

RAW = ROOT / "data" / "raw"
SNAP = ROOT / "data" / "snapshots"
PROC = ROOT / "data" / "processed"
GEO = ROOT / "data" / "geo"
DROP_KEYS = {"PHONE", "EMAIL", "CONTACT", "PHOTO_FILE", "GLOBALID", "OWNER_NAME", "FULL_OWNER"}


def load_geo(name: str) -> dict:
    return json.loads((RAW / name).read_text())


def centroid(geom: dict | None) -> tuple[float | None, float | None]:
    if not geom:
        return None, None
    coords: list[list[float]] = []

    def walk(node):
        if not node:
            return
        if isinstance(node[0], (int, float)):
            coords.append(node)
        else:
            for child in node:
                walk(child)

    walk(geom.get("coordinates"))
    if not coords:
        return None, None
    return (
        round(sum(c[0] for c in coords) / len(coords), 6),
        round(sum(c[1] for c in coords) / len(coords), 6),
    )


def clean_props(props: dict) -> dict:
    return {k: v for k, v in props.items() if k not in DROP_KEYS}


def strip_feature_collection(fc: dict) -> dict:
    features = []
    for ft in fc.get("features") or []:
        features.append({
            "type": "Feature",
            "geometry": ft.get("geometry"),
            "properties": clean_props(ft.get("properties") or {}),
        })
    return {"type": "FeatureCollection", "features": features}


def norm_addr(value: str | None) -> str:
    return " ".join((value or "").upper().split())


def year_or_none(value) -> int | None:
    try:
        year = int(value)
    except (TypeError, ValueError):
        return None
    if year < 1800 or year > 2030:
        return None
    return year


def num_or_none(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def write_context_and_registry_placeholders() -> None:
    """Context stats and the registry are authored files. Validate them here."""
    stats = json.loads((PROC / "context_stats.json").read_text())
    required = {"value", "as_of", "source_name", "source_url", "retrieved_at", "status", "verified", "caveat"}
    for key, entry in stats.items():
        missing = required - set(entry)
        if missing:
            raise SystemExit(f"{key} missing {missing}")


def main() -> None:
    SNAP.mkdir(parents=True, exist_ok=True)
    PROC.mkdir(parents=True, exist_ok=True)
    GEO.mkdir(parents=True, exist_ok=True)

    he_buildings = strip_feature_collection(load_geo("he_buildings.geojson"))
    he_west = strip_feature_collection(load_geo("he_west.geojson"))
    city = strip_feature_collection(load_geo("city_owned_oakland.geojson"))
    assessed = json.loads((RAW / "county_assessed.json").read_text())

    by_addr: dict[str, dict] = {}
    he_features = []
    seen_apn = set()
    for ft in he_west["features"] + he_buildings["features"]:
        props = ft["properties"]
        apn = (props.get("APN_12") or "").strip()
        if apn and apn in seen_apn:
            continue
        if apn:
            seen_apn.add(apn)
        he_features.append(ft)
        addr = norm_addr(props.get("FULL_SITUS"))
        by_addr[addr] = ft

    (SNAP / "housing_element_buildings.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": he_features}))

    city_features = []
    city_apns = set()
    for ft in city["features"]:
        props = ft["properties"]
        city_name = (props.get("CITY") or "").strip().lower()
        if city_name and city_name != "oakland":
            continue
        city_features.append(ft)
        if props.get("APN"):
            city_apns.add(" ".join(props["APN"].split()))
    (SNAP / "city_owned_oakland.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": city_features}))

    assessed_by_addr: dict[str, list] = {}
    for row in assessed:
        addr = norm_addr(row.get("SitusAddress"))
        assessed_by_addr.setdefault(addr, []).append({
            "apn": row.get("APN"),
            "situs_address": row.get("SitusAddress"),
            "situs_zip": row.get("SitusZip"),
            "use_code": row.get("UseCode"),
            "land_value": row.get("Land"),
            "improvement_value": row.get("Imps"),
            "assessed_value": row.get("TotalNetValue"),
            "source_id": "ac_parcels",
            "status": "PUBLIC",
        })
    (SNAP / "alameda_county_parcels.json").write_text(json.dumps(assessed_by_addr, indent=2))

    property_rows = []
    scenario_rows = []
    candidate_features = []
    for seed in CANDIDATES:
        match = None
        for addr, ft in by_addr.items():
            if addr.startswith(seed["match"]):
                match = (addr, ft)
                break
        if match is None:
            raise SystemExit(f"No housing-element feature for {seed['property_id']} {seed['match']}")
        addr, ft = match
        props = ft["properties"]
        lng, lat = centroid(ft.get("geometry"))
        tasks = seed["tasks"]
        hours = sum(t["estimated_worker_hours"] for t in tasks)
        cost = sum(t["estimated_cost"] for t in tasks)
        funds = seed["identified_funds"]
        gap = cost - funds
        apn = (props.get("APN_12") or "").strip() or None
        apn_compact = " ".join(apn.split()) if apn else None
        city_owned = apn_compact in city_apns if apn_compact else False
        total_cap = props.get("TOTALCAP")
        try:
            total_cap = int(total_cap) if total_cap is not None else None
        except (TypeError, ValueError):
            total_cap = None
        zoning = props.get("BASEZONE_1") or props.get("ZNLABEL_1")
        if zoning in (None, "", "NA", "<Null>"):
            zoning = None
        row = {
            "property_id": seed["property_id"],
            "apn": apn,
            "address": props.get("FULL_SITUS"),
            "latitude": lat,
            "longitude": lng,
            "neighborhood": seed["neighborhood"],
            "block_id": seed["block_id"],
            "ownership_type": "CITY_OWNED" if city_owned else "NOT_IN_CACHED_CITY_OWNED_EXTRACT",
            "ownership_source": "oakland_city_owned" if city_owned else "oakland_city_owned",
            "building_type": props.get("USEDESCRIP"),
            "year_built": year_or_none(props.get("YEARBUILT")),
            "building_sqft": num_or_none(props.get("BLDG_AREA_")),
            "existing_units": num_or_none(props.get("SHP_NO_UNI")),
            "housing_element_site": True,
            "housing_element_capacity": total_cap,
            "housing_element_vlow": num_or_none(props.get("VLOWCAP")),
            "housing_element_low": num_or_none(props.get("LOWCAP")),
            "housing_element_mod": num_or_none(props.get("MODCAP")),
            "housing_element_amod": num_or_none(props.get("AMODCAP")),
            "housing_element_status": props.get("STATUS"),
            "housing_element_type": props.get("HESITETYPE"),
            "zoning": zoning,
            "general_plan_code": props.get("GPLANCODE"),
            "historic_status": None,
            "environmental_status": "UNKNOWN",
            "asbestos_status": "UNKNOWN",
            "candidate_potential_units": seed["potential_units"],
            "potential_units_source": "DEMO",
            "rehab_stage": seed["primary_blocker"],
            "primary_blocker": seed["primary_blocker"],
            "estimated_cost": cost,
            "identified_funds": funds,
            "modeled_funding_gap": gap,
            "estimated_worker_hours": hours,
            "work_package_count": len(tasks),
            "public_data_confidence": "GIS attributes from cached Housing Element and, where joined, County parcels. Rehabilitation scope is DEMO.",
            "county_parcel_count": len(assessed_by_addr.get(addr, [])),
            "source_ids": "oakland_housing_element,ac_parcels" if assessed_by_addr.get(addr) else "oakland_housing_element",
        }
        property_rows.append(row)
        for index, task in enumerate(tasks, start=1):
            scenario_rows.append({
                "rehab_scenario_id": f"{seed['property_id']}-T{index}",
                "property_id": seed["property_id"],
                **task,
            })
        feature_props = {
            "property_id": seed["property_id"],
            "address": row["address"],
            "neighborhood": seed["neighborhood"],
            "primary_blocker": seed["primary_blocker"],
            "candidate_potential_units": seed["potential_units"],
            "potential_units_source": "DEMO",
            "housing_element_capacity": total_cap,
            "block_id": seed["block_id"],
            "layer": "candidate",
        }
        candidate_features.append({
            "type": "Feature",
            "geometry": ft.get("geometry"),
            "properties": feature_props,
        })

    # County joins are attached after every candidate has been matched.
    joins = {}
    for seed in CANDIDATES:
        addr = next(a for a in by_addr if a.startswith(seed["match"]))
        joins[seed["property_id"]] = assessed_by_addr.get(addr, [])
    (SNAP / "candidate_county_joins.json").write_text(json.dumps(joins, indent=2))

    pl.DataFrame(property_rows).write_parquet(PROC / "properties.parquet")
    pl.DataFrame(scenario_rows).write_parquet(PROC / "rehab_scenarios.parquet")
    pl.DataFrame(WORKFORCE).write_parquet(PROC / "workforce_demo.parquet")
    pl.DataFrame(DEMO_CONTRACTORS).write_parquet(PROC / "contractors_demo.parquet")
    (GEO / "candidates.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": candidate_features}))
    (GEO / "city_owned.geojson").write_text((SNAP / "city_owned_oakland.geojson").read_text())
    (GEO / "housing_element.geojson").write_text((SNAP / "housing_element_buildings.geojson").read_text())
    write_basemap()
    write_context_and_registry_placeholders()
    print(f"properties {len(property_rows)} scenarios {len(scenario_rows)} units {sum(r['candidate_potential_units'] for r in property_rows)}")


def _join_pairs(candidates, by_addr):
    for seed in candidates:
        addr = next(a for a in by_addr if a.startswith(seed["match"]))
        yield seed, addr


def write_basemap() -> None:
    boundary = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"name": "Oakland (schematic shoreline)", "status": "DEMO", "note": "Schematic outline for offline orientation. Not a survey boundary."},
            "geometry": {"type": "Polygon", "coordinates": [[
                [-122.355, 37.806], [-122.332, 37.828], [-122.285, 37.858],
                [-122.230, 37.868], [-122.155, 37.848], [-122.120, 37.808],
                [-122.145, 37.762], [-122.185, 37.728], [-122.230, 37.722],
                [-122.275, 37.748], [-122.318, 37.782], [-122.355, 37.806],
            ]]},
        }],
    }
    neighborhoods = {
        "type": "FeatureCollection",
        "features": [
            box("West Oakland", -122.322, 37.800, -122.275, 37.822),
            box("Downtown", -122.280, 37.798, -122.258, 37.812),
            box("Jack London", -122.290, 37.788, -122.262, 37.800),
            box("Uptown", -122.275, 37.808, -122.255, 37.822),
            box("San Antonio", -122.255, 37.778, -122.225, 37.798),
            box("Fruitvale", -122.230, 37.768, -122.205, 37.788),
            box("East Oakland", -122.210, 37.735, -122.155, 37.775),
            box("North Oakland", -122.275, 37.822, -122.240, 37.852),
        ],
    }
    streets = {
        "type": "FeatureCollection",
        "features": [
            line("I-880 schematic", [[-122.320, 37.788], [-122.290, 37.798], [-122.255, 37.795], [-122.210, 37.770], [-122.175, 37.745]]),
            line("San Pablo Ave", [[-122.300, 37.812], [-122.285, 37.815], [-122.270, 37.812]]),
            line("Broadway", [[-122.272, 37.793], [-122.270, 37.808], [-122.265, 37.830]]),
            line("Telegraph Ave", [[-122.275, 37.808], [-122.268, 37.825], [-122.262, 37.845]]),
            line("International Blvd", [[-122.250, 37.792], [-122.225, 37.782], [-122.190, 37.762], [-122.165, 37.748]]),
            line("7th St", [[-122.305, 37.806], [-122.285, 37.803], [-122.270, 37.800]]),
            line("MacArthur", [[-122.290, 37.822], [-122.250, 37.828], [-122.210, 37.812]]),
        ],
    }
    (GEO / "oakland_boundary.geojson").write_text(json.dumps(boundary))
    (GEO / "neighborhoods.geojson").write_text(json.dumps(neighborhoods))
    (GEO / "streets.geojson").write_text(json.dumps(streets))
    block = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "block_id": "west-oakland-7th",
                "name": "West Oakland block",
                "note": "Navigation extent around the three modeled candidates. Not a legal block.",
            },
            "geometry": {"type": "Polygon", "coordinates": [[
                [-122.300, 37.800], [-122.285, 37.800], [-122.285, 37.818],
                [-122.300, 37.818], [-122.300, 37.800],
            ]]},
        }],
    }
    (GEO / "blocks.geojson").write_text(json.dumps(block))


def box(name, xmin, ymin, xmax, ymax):
    return {
        "type": "Feature",
        "properties": {
            "name": name,
            "status": "DEMO",
            "note": "Approximate navigation box. Not an official neighborhood boundary.",
        },
        "geometry": {"type": "Polygon", "coordinates": [[
            [xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin],
        ]]},
    }


def line(name, coords):
    return {
        "type": "Feature",
        "properties": {"name": name, "status": "DEMO", "note": "Schematic street for offline orientation."},
        "geometry": {"type": "LineString", "coordinates": coords},
    }


if __name__ == "__main__":
    main()
