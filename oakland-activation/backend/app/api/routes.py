from __future__ import annotations  # noqa: F401 — keep 3.9 parsing happy

from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.app.config import demo_mode, gemini_enabled, workforce_mode
from backend.app.providers import DIRTradeProvider, workforce_provider
from backend.app.services.demo_script import build_demo
from backend.app.models.schemas import TradeAvailability
from backend.app.services.workforce import PartnerDataRequired, public_availability

ROOT = Path(__file__).resolve().parents[3]

router = APIRouter()


def _engine():
    from backend.app.main import engine
    return engine


@router.get("/health")
def health():
    return {
        "ok": True,
        "demo_mode": demo_mode(),
        "workforce_source_mode": workforce_mode(),
        "gemini": gemini_enabled(),
        "network": "local snapshots only" if demo_mode() else "live providers enabled",
    }


@router.get("/context-stats")
def context_stats():
    stats = _engine().context_stats()
    visible = {key: value for key, value in stats.items() if key != "hcd_nc_nofa"}
    return {"stats": visible, "hidden_unverified": ["hcd_nc_nofa"]}


@router.get("/map")
def map_payload(
    blocker: Optional[List[str]] = Query(default=None),
    neighborhood: Optional[str] = None,
    block_id: Optional[str] = None,
):
    engine = _engine()
    rows = engine.filter_properties(blockers=blocker, neighborhood=neighborhood, block_id=block_id)
    features = engine.geo("candidates.geojson")
    visible = {row["property_id"] for row in rows}
    features = {
        "type": "FeatureCollection",
        "features": [ft for ft in features["features"] if ft["properties"]["property_id"] in visible],
    }
    return {
        "capacity": engine.capacity(rows),
        "candidates": features,
        "city_owned": engine.geo("city_owned.geojson"),
        "housing_element": engine.geo("housing_element.geojson"),
        "neighborhoods": engine.geo("neighborhoods.geojson"),
        "boundary": engine.geo("oakland_boundary.geojson"),
        "streets": engine.geo("streets.geojson"),
        "blocks": engine.geo("blocks.geojson"),
        "environmental_records": [],
        "environmental_note": "No environmental record loaded in current MVP dataset. Asbestos is UNKNOWN. This is not a finding of no environmental risk.",
        "basemap": "Local schematic boundary, streets, and cached parcel polygons. No remote tile server.",
        "properties": [engine.public_property(row) for row in rows],
    }


@router.get("/properties/{property_id}")
def property_detail(property_id: str):
    engine = _engine()
    row = engine.property(property_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Unknown property")
    record = engine.public_property(row)
    record["wage_notice"] = DIRTradeProvider(engine).notice()
    record["crew"] = engine.crew(property_id)
    record["activate"] = _activate(record)
    return record


@router.get("/properties/{property_id}/crew")
def property_crew(property_id: str):
    try:
        return _engine().crew(property_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown property")


@router.get("/workforce")
def workforce():
    mode = workforce_mode()
    engine = _engine()
    try:
        provider = workforce_provider(mode, engine)
        rows = provider.get_aggregate_availability()
    except PartnerDataRequired:
        return {
            "mode": mode,
            "status": "PARTNER_REQUIRED",
            "message": "Partner data required",
            "rows": [],
            "banner": "Partner data required. Demo counts are not substituted.",
            "real_bench_note": "Real bench counts require partner authorization.",
        }
    published = [TradeAvailability(**row).model_dump() for row in public_availability(rows)]
    return {
        "mode": mode,
        "status": "DEMO" if mode == "DEMO" else "PUBLIC",
        "banner": "DEMO — simulated. Real availability requires authorization from participating unions." if mode == "DEMO" else None,
        "real_bench_note": "Real bench counts require partner authorization.",
        "as_of": published[0]["as_of"] if published else None,
        "rows": published,
        "chart": engine.demand_chart() if mode == "DEMO" else [],
        "total_display": "suppressed" if any(row["suppressed"] for row in published) else str(sum(row["count"] or 0 for row in published)),
        "controls": [
            "Opt in. Nothing is assumed.",
            "Pause or revoke at any time.",
            "Aggregate counts by trade only.",
            "Dispatch rules stay with the hiring hall.",
        ],
        "participation_metrics": "Partner data required",
        "contract": {
            "fields": ["trade", "classification", "count", "suppressed", "as_of", "source_id", "source_status"],
            "suppression": "Any aggregate cell with a true count from 1 to 4 is returned as null and displayed as <5. The true small count is not included.",
            "excluded": ["names", "addresses", "demographics", "individual out-of-work status"],
        },
    }


@router.get("/bottlenecks")
def bottlenecks():
    return {"groups": _engine().bottlenecks(), "source_status": "DEMO"}


@router.get("/blocks/{block_id}")
def unlock_block(block_id: str):
    summary = _engine().block_summary(block_id)
    if summary["property_count"] == 0:
        raise HTTPException(status_code=404, detail="Unknown block")
    summary["label"] = "Modeled block summary — not a project approval."
    summary["source_status"] = "DEMO"
    return summary


@router.post("/scenarios/run")
def run_scenario(body: dict):
    engine = _engine()
    scenario_id = body.get("scenario_id")
    before_gap = engine.property("BB-001")["modeled_funding_gap"]
    if scenario_id == "funding_500k":
        result = engine.scenario_funding(int(body.get("budget", 500_000)))
    elif scenario_id == "add_plumbers":
        result = engine.scenario_add_workers("plumbing", int(body.get("additional", 10)))
    elif scenario_id == "remediation_crew":
        result = engine.scenario_remediation_crew()
    elif scenario_id == "city_owned_only":
        result = engine.scenario_city_owned()
    elif scenario_id == "resolve_environmental":
        result = engine.scenario_resolve_environmental(body.get("property_id", "BB-001"))
    else:
        raise HTTPException(status_code=400, detail="Unknown scenario")
    if engine.property("BB-001")["modeled_funding_gap"] != before_gap:
        raise HTTPException(status_code=500, detail="Baseline mutated")
    return result


@router.get("/scenarios")
def scenario_catalog():
    return {
        "label": "Scenario comparison — not a funding recommendation or project approval.",
        "scenarios": [
            {"id": "funding_500k", "prompt": "What if Oakland had $500,000 for rehabilitation?"},
            {"id": "add_plumbers", "prompt": "What if 10 plumbers became available?"},
            {"id": "remediation_crew", "prompt": "What if a certified remediation crew became available?"},
            {"id": "city_owned_only", "prompt": "City-owned candidates only"},
            {"id": "resolve_environmental", "prompt": "What if we resolve the environmental barrier on this building?", "property_id": "BB-001"},
        ],
    }


@router.get("/demo")
def demo():
    return build_demo(_engine())


@router.get("/methodology")
def methodology():
    text = (ROOT / "METHODOLOGY.md").read_text()
    return {"markdown": text}


@router.get("/contractors")
def contractors():
    return {
        "source_status": "DEMO",
        "note": "Illustrative demo firms. A CSLB bulk extract and the County qualified-contractor list were not loaded. Not an endorsement or bid. Union status: Unknown.",
        "rows": _engine().contractors_for(["plumbing", "electrical", "carpentry", "laborers", "hvac", "environmental_specialist"]),
    }


def _activate(record: dict) -> dict:
    return {
        "disclaimer": "Modeled hackathon scenario — professional assessment required.",
        "steps": [
            {"key": "dormant", "title": "Dormant property", "detail": record["address"]},
            {"key": "assess", "title": "Assess", "detail": "Asbestos: UNKNOWN. Professional inspection required."},
            {"key": "scope", "title": "Rehabilitation scope", "detail": f"{record['work_package_count']} modeled work packages"},
            {"key": "trades", "title": "Trade demand", "detail": "Plumbing, electrical, carpentry, environmental remediation"},
            {"key": "bench", "title": "Out-of-work capacity", "detail": "DEMO workforce. Real bench counts require partner authorization."},
            {"key": "contractors", "title": "Licensed contractors", "detail": "Illustrative demo firms. Union status: Unknown."},
            {"key": "barrier", "title": "Remaining barrier", "detail": record["primary_blocker"].replace("_", " ").title()},
            {"key": "rehab", "title": "Rehabilitation", "detail": "Modeled sequence, not a notice to proceed."},
            {"key": "result", "title": f"+{record['candidate_potential_units']} potential housing units", "detail": f"+{record['estimated_worker_hours']:,} estimated worker-hours"},
        ],
        "who_benefits_label": "Potential benefits to validate with partners.",
        "who_benefits": [
            {"who": "Workers", "line": "Visible demand, more hours."},
            {"who": "Locals and trades", "line": "Advance notice of work; dispatch stays with the hall."},
            {"who": "City", "line": "Faster use of housing funds, local-hire reporting."},
            {"who": "County", "line": "A clearer picture of where rehab capacity sits."},
            {"who": "Residents seeking housing", "line": "Potential units stay attached to a work package and a blocker."},
            {"who": "Contractors", "line": "Scope and trade demand without a bid or an endorsement."},
        ],
    }
