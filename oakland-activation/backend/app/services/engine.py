"""Deterministic BenchBridge engine. All headline numbers are computed here."""

from __future__ import annotations

import json
import threading
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

import duckdb

from backend.app.services.workforce import (
    SUPPRESSION_MIN,
    availability_rows,
    public_availability,
)

ROOT = Path(__file__).resolve().parents[3]
PROC = ROOT / "data" / "processed"
GEO = ROOT / "data" / "geo"
SNAP = ROOT / "data" / "snapshots"

BLOCKER_GROUPS = {
    "ENVIRONMENTAL_REMEDIATION": "environmental",
    "ENVIRONMENTAL_REVIEW": "environmental",
    "FUNDING_GAP": "funding",
    "SPECIALIZED_WORKFORCE_GAP": "specialized_workforce",
    "PLANNING_REVIEW": "planning",
    "ASSESSMENT_NEEDED": "assessment",
    "READY_FOR_FURTHER_EVALUATION": "ready",
    "REHABILITATION_UNDERWAY": "underway",
    "ACTIVATED": "activated",
}

TRADE_LABELS = {
    "plumbing": "Plumbers",
    "electrical": "Electricians",
    "carpentry": "Carpenters",
    "laborers": "Laborers",
    "hvac": "HVAC technicians",
    "environmental_specialist": "Environmental specialists",
}


class Engine:
    def __init__(self, root: Path | None = None):
        self.root = root or ROOT
        self.proc = self.root / "data" / "processed"
        self.geo_dir = self.root / "data" / "geo"
        self.snap = self.root / "data" / "snapshots"
        self.con = duckdb.connect()
        self._lock = threading.Lock()
        self.con.execute(
            f"CREATE TABLE properties AS SELECT * FROM read_parquet('{(self.proc / 'properties.parquet').as_posix()}')"
        )
        self.con.execute(
            f"CREATE TABLE scenarios AS SELECT * FROM read_parquet('{(self.proc / 'rehab_scenarios.parquet').as_posix()}')"
        )
        self.con.execute(
            f"CREATE TABLE workforce AS SELECT * FROM read_parquet('{(self.proc / 'workforce_demo.parquet').as_posix()}')"
        )
        self.con.execute(
            f"CREATE TABLE contractors AS SELECT * FROM read_parquet('{(self.proc / 'contractors_demo.parquet').as_posix()}')"
        )
        self._county = json.loads((self.snap / "candidate_county_joins.json").read_text())
        self._properties = self._load_properties()
        self._scenarios = self._load_scenarios()

    def _rows(self, sql: str) -> list[dict]:
        with self._lock:
            cursor = self.con.execute(sql)
            columns = [item[0] for item in cursor.description]
            raw_rows = cursor.fetchall()
        records = []
        for raw in raw_rows:
            record = {}
            for key, value in zip(columns, raw):
                if hasattr(value, "item"):
                    value = value.item()
                record[key] = value
            records.append(record)
        return records

    def _load_properties(self) -> list[dict]:
        records = self._rows("SELECT * FROM properties ORDER BY property_id")
        scenarios = self._scenarios_raw()
        by_id: dict[str, list] = {}
        for task in scenarios:
            by_id.setdefault(task["property_id"], []).append(task)
        for record in records:
            record["county_parcels"] = self._county.get(record["property_id"], [])
            record["tasks"] = by_id.get(record["property_id"], [])
            record["estimated_worker_hours"] = int(sum(t["estimated_worker_hours"] for t in record["tasks"]))
            record["estimated_cost"] = int(sum(t["estimated_cost"] for t in record["tasks"]))
            record["identified_funds"] = int(record["identified_funds"])
            record["modeled_funding_gap"] = int(record["estimated_cost"] - record["identified_funds"])
            record["work_package_count"] = len(record["tasks"])
            record["candidate_potential_units"] = int(record["candidate_potential_units"])
        self._cache = records
        return records

    def _scenarios_raw(self) -> list[dict]:
        return self._rows("SELECT * FROM scenarios ORDER BY rehab_scenario_id")

    def _load_scenarios(self) -> list[dict]:
        return self._scenarios_raw()

    @property
    def properties(self) -> list[dict]:
        return self._cache

    def workforce_true(self) -> list[dict]:
        return availability_rows(self._rows("SELECT * FROM workforce ORDER BY trade"))

    def workforce_total(self) -> int:
        return int(sum(row["count"] for row in self.workforce_true()))

    def workforce_public(self) -> list[dict]:
        return public_availability(self.workforce_true())

    def citywide_units(self) -> int:
        with self._lock:
            value = self.con.execute("SELECT SUM(candidate_potential_units) FROM properties").fetchone()[0]
        return int(value)

    def property(self, property_id: str) -> dict | None:
        for record in self.properties:
            if record["property_id"] == property_id:
                return record
        return None

    def filter_properties(
        self,
        blockers: list[str] | None = None,
        neighborhood: str | None = None,
        block_id: str | None = None,
        city_owned_only: bool = False,
    ) -> list[dict]:
        rows = self.properties
        if blockers:
            wanted = set(blockers)
            rows = [row for row in rows if row["primary_blocker"] in wanted]
        if neighborhood:
            rows = [row for row in rows if row["neighborhood"] == neighborhood]
        if block_id:
            rows = [row for row in rows if row["block_id"] == block_id]
        if city_owned_only:
            rows = [row for row in rows if row["ownership_type"] == "CITY_OWNED"]
        return rows

    def required_trades(self, rows: list[dict]) -> list[str]:
        trades = []
        seen = set()
        for row in rows:
            for task in row["tasks"]:
                if task["trade"] not in seen:
                    seen.add(task["trade"])
                    trades.append(task["trade"])
        return trades

    def workforce_capacity(self, rows: list[dict] | None = None) -> int:
        rows = self.properties if rows is None else rows
        supply = {item["trade"]: item["count"] for item in self.workforce_true()}
        return int(sum(supply[trade] for trade in self.required_trades(rows) if trade in supply))

    def trade_demand(self, rows: list[dict]) -> dict[str, dict]:
        demand: dict[str, dict] = {}
        for row in rows:
            for task in row["tasks"]:
                bucket = demand.setdefault(task["trade"], {"workers": 0, "hours": 0})
                bucket["workers"] += int(task["estimated_workers"])
                bucket["hours"] += int(task["estimated_worker_hours"])
        return demand

    def crew(self, property_id: str, supply_override: dict[str, int] | None = None) -> dict:
        record = self.property(property_id)
        if record is None:
            raise KeyError(property_id)
        supply = {item["trade"]: item["count"] for item in self.workforce_true()}
        if supply_override:
            supply.update(supply_override)
        demand = self.trade_demand([record])
        lines = []
        for trade, needed in demand.items():
            available = supply.get(trade)
            gap = None if available is None else int(available) - int(needed["workers"])
            lines.append({
                "trade": trade,
                "label": TRADE_LABELS.get(trade, trade),
                "needed_workers": int(needed["workers"]),
                "needed_hours": int(needed["hours"]),
                "demo_available": available,
                "gap": gap,
                "source_status": "DEMO",
                "suppressed_on_bench_board": available is not None and 0 < available < SUPPRESSION_MIN,
            })
        shortages = [line for line in lines if line["gap"] is not None and line["gap"] < 0]
        trades = [line["trade"] for line in lines]
        contractors = self.contractors_for(trades)
        return {
            "property_id": property_id,
            "label": "WORKFORCE CAPACITY MATCH — not official dispatch.",
            "dispatch_note": "Official dispatch stays with participating unions or hiring halls. BenchBridge does not dispatch workers.",
            "real_bench_note": "Real bench counts require partner authorization.",
            "source_status": "DEMO",
            "lines": lines,
            "shortages": shortages,
            "contractors": contractors,
            "contractor_note": "Illustrative demo firms. Not a CSLB extract, not a bid, and not an endorsement.",
        }

    def contractors_for(self, trades: list[str]) -> list[dict]:
        rows = self._rows("SELECT * FROM contractors")
        matched = []
        for row in rows:
            if isinstance(row["trades"], list):
                row_trades = row["trades"]
            else:
                text = str(row["trades"])
                row_trades = [part.strip(" '\"") for part in text.strip("[]").split(",") if part.strip(" '\"")]
            if any(trade in row_trades for trade in trades):
                row = dict(row)
                row["trades"] = row_trades
                row["union_status"] = "Unknown"
                row["endorsement"] = "Illustrative demo firm — not an endorsement or bid."
                matched.append(row)
        return matched

    def block_summary(self, block_id: str) -> dict:
        rows = self.filter_properties(block_id=block_id)
        return self._bundle(rows, {"block_id": block_id})

    def bottlenecks(self) -> list[dict]:
        rows = self.properties
        total = len(rows) or 1
        counts: dict[str, int] = {}
        for row in rows:
            group = BLOCKER_GROUPS.get(row["primary_blocker"], "other")
            counts[group] = counts.get(group, 0) + 1
        payload = []
        for group, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
            payload.append({
                "group": group,
                "count": count,
                "percent": round(100 * count / total, 4),
                "property_ids": [row["property_id"] for row in rows if BLOCKER_GROUPS.get(row["primary_blocker"], "other") == group],
                "source_status": "DEMO",
                "note": "Share of modeled candidate primary blockers. Computed from the seed. Not a City project-status report.",
            })
        return payload

    def scenario_funding(self, budget: int = 500_000) -> dict:
        eligible = [
            row for row in self.properties
            if row["primary_blocker"] == "FUNDING_GAP" and row["modeled_funding_gap"] > 0
        ]
        eligible.sort(key=lambda row: (row["modeled_funding_gap"] / row["candidate_potential_units"], row["property_id"]))
        spent = 0
        affected = []
        stopped = None
        for row in eligible:
            gap = int(row["modeled_funding_gap"])
            if spent + gap <= budget:
                affected.append(row)
                spent += gap
            else:
                stopped = row
                break
        bundle = self._bundle(affected, {})
        return {
            "scenario_id": "funding_500k",
            "budget": budget,
            "spent": spent,
            "remaining_budget": budget - spent,
            "rule": "Fund candidates whose primary blocker is a modeled funding gap, cheapest gap-per-unit first, full gap or skip, stop at the first project that does not fit.",
            "affected_count": len(affected),
            "potential_units": bundle["potential_units"],
            "estimated_worker_hours": bundle["estimated_worker_hours"],
            "neighborhoods": bundle["neighborhoods"],
            "neighborhood_count": len(bundle["neighborhoods"]),
            "property_ids": [row["property_id"] for row in affected],
            "projects": [self._project_result(row, funding_resolved=True) for row in affected],
            "stopped_at": None if stopped is None else {
                "property_id": stopped["property_id"],
                "modeled_funding_gap": stopped["modeled_funding_gap"],
                "reason": "Full remaining gap does not fit in the leftover budget. Later projects are not considered.",
            },
            "label": "Scenario comparison — not a funding recommendation or project approval.",
            "source_status": "DEMO",
        }

    def scenario_add_workers(self, trade: str, additional: int) -> dict:
        supply = {item["trade"]: item["count"] for item in self.workforce_true()}
        before = supply.get(trade, 0)
        supply[trade] = before + additional
        return self._workforce_scenario(
            scenario_id=f"add_{additional}_{trade}",
            description=f"What if {additional} additional {TRADE_LABELS.get(trade, trade)} were on the demo bench?",
            supply=supply,
        )

    def scenario_remediation_crew(self, additional: int = 4) -> dict:
        """A certified remediation crew is modeled as +4 environmental specialists on the demo bench."""
        return self.scenario_add_workers("environmental_specialist", additional) | {
            "scenario_id": "remediation_crew",
            "description": "What if a certified remediation crew became available? Modeled as four additional environmental specialists on the demo bench.",
        }

    def scenario_city_owned(self) -> dict:
        rows = self.filter_properties(city_owned_only=True)
        bundle = self._bundle(rows, {})
        bundle.update({
            "scenario_id": "city_owned_only",
            "description": "City-owned candidates only. Ownership is city-owned only when the cached CityOwnedProperties extract contains the APN.",
            "label": "Scenario comparison — not a funding recommendation or project approval.",
            "source_status": "PUBLIC",
        })
        return bundle

    def scenario_resolve_environmental(self, property_id: str) -> dict:
        record = self.property(property_id)
        if record is None:
            raise KeyError(property_id)
        remaining = []
        if record["primary_blocker"] in {"ENVIRONMENTAL_REMEDIATION", "ENVIRONMENTAL_REVIEW"}:
            if record["modeled_funding_gap"] > 0:
                remaining.append({
                    "blocker": "FUNDING_GAP",
                    "modeled_funding_gap": record["modeled_funding_gap"],
                    "source_status": "DEMO",
                })
            remaining.append({
                "blocker": "PROFESSIONAL_INSPECTION",
                "note": "Resolving the modeled environmental package does not certify the building. Asbestos remains UNKNOWN.",
            })
        else:
            remaining.append({"blocker": record["primary_blocker"], "note": "Environmental resolution does not change a different primary blocker."})
        return {
            "scenario_id": "resolve_environmental",
            "property_id": property_id,
            "primary_blocker_before": record["primary_blocker"],
            "remaining_blockers": remaining,
            "baseline_unchanged": True,
            "label": "Scenario comparison — not a funding recommendation or project approval.",
            "source_status": "DEMO",
        }

    def _workforce_scenario(self, scenario_id: str, description: str, supply: dict[str, int]) -> dict:
        results = []
        for row in self.properties:
            crew = self.crew(row["property_id"], supply_override=supply)
            results.append({
                "property_id": row["property_id"],
                "shortages": crew["shortages"],
            })
        return {
            "scenario_id": scenario_id,
            "description": description,
            "supply": [
            {
                "trade": trade,
                "label": TRADE_LABELS.get(trade, trade),
                "count": None if 0 < count < SUPPRESSION_MIN else count,
                "display": "<5" if 0 < count < SUPPRESSION_MIN else str(count),
                "suppressed": 0 < count < SUPPRESSION_MIN,
                "source_status": "DEMO",
            }
                for trade, count in supply.items()
            ],
            "properties": results,
            "baseline_unchanged": True,
            "label": "Scenario comparison — not a funding recommendation or project approval.",
            "source_status": "DEMO",
            "real_bench_note": "Real bench counts require partner authorization.",
        }

    def _project_result(self, row: dict, funding_resolved: bool) -> dict:
        remaining = []
        if not funding_resolved and row["modeled_funding_gap"] > 0:
            remaining.append("FUNDING_GAP")
        if row["primary_blocker"] not in {"FUNDING_GAP", "ACTIVATED", "READY_FOR_FURTHER_EVALUATION"}:
            remaining.append(row["primary_blocker"])
        if funding_resolved:
            remaining = [item for item in remaining if item != "FUNDING_GAP"]
            if row["primary_blocker"] != "FUNDING_GAP":
                remaining.append(row["primary_blocker"])
        remaining.append("INSPECTION_OWNER_DISPOSITION_AND_BIDS_UNKNOWN")
        return {
            "property_id": row["property_id"],
            "address": row["address"],
            "neighborhood": row["neighborhood"],
            "potential_units": row["candidate_potential_units"],
            "estimated_worker_hours": row["estimated_worker_hours"],
            "modeled_funding_gap": row["modeled_funding_gap"],
            "funding_fully_covered": funding_resolved,
            "remaining_blockers": remaining,
            "source_status": "DEMO",
        }

    def _bundle(self, rows: list[dict], extra: dict) -> dict:
        neighborhoods = sorted({row["neighborhood"] for row in rows})
        blocker_counts: dict[str, int] = {}
        for row in rows:
            group = BLOCKER_GROUPS.get(row["primary_blocker"], row["primary_blocker"])
            blocker_counts[group] = blocker_counts.get(group, 0) + 1
        demand = self.trade_demand(rows)
        supply = {item["trade"]: item["count"] for item in self.workforce_true()}
        coverage = []
        for trade, needed in demand.items():
            available = supply.get(trade)
            suppressed = available is not None and 0 < available < SUPPRESSION_MIN
            coverage.append({
                "trade": trade,
                "label": TRADE_LABELS.get(trade, trade),
                "needed_workers": needed["workers"],
                "needed_hours": needed["hours"],
                "demo_available": None if suppressed else available,
                "demo_available_display": "<5" if suppressed else str(available),
                "source_status": "DEMO",
            })
        payload = {
            "property_count": len(rows),
            "property_ids": [row["property_id"] for row in rows],
            "potential_units": int(sum(row["candidate_potential_units"] for row in rows)),
            "estimated_worker_hours": int(sum(row["estimated_worker_hours"] for row in rows)),
            "neighborhoods": neighborhoods,
            "blocker_counts": blocker_counts,
            "coverage": coverage,
            "properties": [self.public_property(row) for row in rows],
        }
        payload.update(extra)
        return payload

    def public_property(self, row: dict) -> dict:
        record = deepcopy(row)
        record["modeled_disclaimer"] = "Modeled hackathon scenario — professional assessment required."
        record["asbestos_note"] = "Asbestos: UNKNOWN. Professional inspection required. Building age is not evidence of asbestos."
        record["approval_note"] = "Housing Element listing is planning context, not project approval and not an approved housing site."
        record["vacancy_note"] = "Assessor use-code text and parcel attributes do not establish vacancy, habitability, or owner disposition."
        record["why_here"] = self.why_here(record)
        record["sources"] = self.sources(record)
        return record

    def why_here(self, row: dict) -> str:
        capacity = row.get("housing_element_capacity")
        status = row.get("housing_element_status") or "status not in extract"
        return (
            f"Public record: City of Oakland 2023–2031 Housing Element Sites Inventory "
            f"(cached GIS). Situs {row.get('address')}. APN {row.get('apn') or 'not in extract'}. "
            f"Inventory status: {status}. Site type: {row.get('housing_element_type') or 'not in extract'}. "
            f"Official projected capacity in that inventory: {capacity if capacity is not None else 'not in extract'}. "
            "That capacity is a planning figure, not an approval. "
            "BenchBridge potential units on this screen are a separate DEMO model."
        )

    def sources(self, row: dict) -> list[dict]:
        items = [
            {"field": "situs, APN, year built, floor area, existing unit count, zoning, use description, housing element capacity and status", "status": "PUBLIC", "source_id": "oakland_housing_element"},
            {"field": "candidate potential units, rehab tasks, costs, funding gap, worker-hours, primary modeled blocker", "status": "DEMO", "source_id": "demo_rehab"},
            {"field": "trade availability", "status": "DEMO", "source_id": "demo_workforce"},
            {"field": "union out-of-work list, inspection, owner disposition, bid, project financing", "status": "PARTNER_REQUIRED", "source_id": "partner_required"},
        ]
        if row.get("county_parcel_count"):
            items.insert(1, {"field": "land value, improvement value, assessed value, county use code", "status": "PUBLIC", "source_id": "ac_parcels"})
        return items

    def capacity(self, rows: list[dict] | None = None) -> dict:
        rows = self.properties if rows is None else rows
        return {
            "property_count": len(rows),
            "potential_units": int(sum(row["candidate_potential_units"] for row in rows)),
            "potential_units_source": "DEMO",
            "workforce_workers": self.workforce_capacity(rows),
            "workforce_source": "DEMO",
            "workforce_note": "Real bench counts require partner authorization.",
        }

    def context_stats(self) -> dict:
        return json.loads((self.proc / "context_stats.json").read_text())

    def geo(self, name: str) -> dict:
        return json.loads((self.geo_dir / name).read_text())

    def demand_chart(self) -> list[dict]:
        demand = self.trade_demand(self.properties)
        public = {row["trade"]: row for row in self.workforce_public()}
        true = {row["trade"]: row for row in self.workforce_true()}
        chart = []
        for trade, truth in true.items():
            published = public[trade]
            chart.append({
                "trade": trade,
                "label": truth["label"],
                "bench_count": published["count"],
                "bench_display": published["display"],
                "suppressed": published["suppressed"],
                "demanded_hours": int(demand.get(trade, {}).get("hours", 0)),
                "demanded_workers": int(demand.get(trade, {}).get("workers", 0)),
                "source_status": "DEMO",
            })
        return chart

    def now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
