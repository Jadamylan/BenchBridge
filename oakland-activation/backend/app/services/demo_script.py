"""Judge-mode script. Copy is fixed; every figure is filled from the engine."""

from __future__ import annotations


def build_demo(engine) -> dict:
    featured = engine.public_property(engine.property("BB-001"))
    crew = engine.crew("BB-001")
    scenario = engine.scenario_funding(500_000)
    block = engine.block_summary("west-oakland-7th")
    stats = engine.context_stats()
    capacity = engine.capacity()
    lines = {line["trade"]: line for line in crew["lines"]}

    def money(value: int) -> str:
        return f"${value:,.0f}"

    pit = stats["pit_oakland_2026"]
    share = stats["pit_oakland_share"]
    jobs = stats["ca_construction_employment"]
    return {
        "title": "BENCHBRIDGE",
        "tagline": "Buildings are waiting. Workers are waiting. People are waiting for housing.",
        "total_seconds": 120,
        "featured_property_id": "BB-001",
        "scenario_property_ids": scenario["property_ids"],
        "capacity": capacity,
        "steps": [
            {
                "id": 1,
                "start": 0,
                "end": 15,
                "kicker": "The gap",
                "title": "Oakland has two types of capacity sitting idle.",
                "body": "Buildings that may have housing potential. Skilled workers waiting for work.",
                "action": "CONNECT THEM",
                "context": [
                    {"id": "pit_oakland_2026", "text": f"{pit['value']:,} people experiencing homelessness in Oakland (2026, preliminary)", "status": "PUBLIC", "verified": pit["verified"]},
                    {"id": "pit_oakland_share", "text": f"{share['value']} of the county's total count", "status": "PUBLIC", "verified": share["verified"]},
                    {"id": "ca_construction_employment", "text": f"California construction jobs {jobs['year_over_change']:+,} year over year", "status": "PUBLIC", "verified": jobs["verified"]},
                ],
            },
            {
                "id": 2,
                "start": 15,
                "end": 30,
                "kicker": "One building",
                "title": f"{featured['candidate_potential_units']} modeled potential housing units",
                "body": "This isn't just a building problem. It's a work package.",
                "trades": ["Plumbing", "Electrical", "Carpentry", "Environmental remediation"],
                "address": featured["address"],
                "units_source": "DEMO",
                "official_planning_capacity": featured["housing_element_capacity"],
                "official_capacity_source": "PUBLIC",
            },
            {
                "id": 3,
                "start": 30,
                "end": 50,
                "kicker": "Build the crew",
                "title": "The general workforce isn't the primary blocker.",
                "action": "BUILD THE CREW",
                "needs": [
                    {"label": "Plumbers", "need": lines["plumbing"]["needed_workers"], "available": lines["plumbing"]["demo_available"]},
                    {"label": "Electricians", "need": lines["electrical"]["needed_workers"], "available": lines["electrical"]["demo_available"]},
                    {"label": "Carpenters", "need": lines["carpentry"]["needed_workers"], "available": lines["carpentry"]["demo_available"]},
                    {"label": "Environmental specialists", "need": lines["environmental_specialist"]["needed_workers"], "available": lines["environmental_specialist"]["demo_available"]},
                ],
                "gap": next(item["gap"] for item in crew["shortages"]),
                "gap_label": "Environmental specialists",
                "source_status": "DEMO",
                "covered": "General trades are covered.",
                "shortage": "Specialist gap remains.",
                "note": "Demo workforce data. Real bench counts require partner authorization. Not official dispatch.",
            },
            {
                "id": 4,
                "start": 50,
                "end": 65,
                "kicker": "The blocker",
                "title": "Current modeled blocker: environmental remediation.",
                "gap_text": f"Modeled funding gap: {money(featured['modeled_funding_gap'])}",
                "funding_gap": featured["modeled_funding_gap"],
                "source_status": "DEMO",
                "asbestos": "Asbestos: UNKNOWN. Professional assessment required.",
                "environmental_extract": "No environmental record loaded in current MVP dataset.",
                "contractor_note": crew["contractor_note"],
            },
            {
                "id": 5,
                "start": 65,
                "end": 80,
                "kicker": "Activate",
                "title": "Building, then work, then workers, then the barrier, then housing.",
                "action": "ACTIVATE",
                "units": featured["candidate_potential_units"],
                "hours": featured["estimated_worker_hours"],
                "result": f"+{featured['candidate_potential_units']} potential housing units · +{featured['estimated_worker_hours']:,} estimated skilled-worker hours",
                "who_benefits_label": "Potential benefits to validate with partners.",
                "who_benefits": [
                    {"who": "Workers", "line": "Visible demand, more hours."},
                    {"who": "Locals and trades", "line": "Advance notice of work; dispatch stays with the hall."},
                    {"who": "City", "line": "Faster use of housing funds, local-hire reporting."},
                    {"who": "County", "line": "A clearer picture of where rehab capacity sits."},
                    {"who": "Residents seeking housing", "line": "Potential units stay attached to a real work package and a named blocker."},
                    {"who": "Contractors", "line": "A public view of scope, trades, and licensed-firm discovery — not a bid."},
                ],
            },
            {
                "id": 6,
                "start": 80,
                "end": 95,
                "kicker": "What if",
                "title": "What if Oakland had $500,000?",
                "affected": scenario["affected_count"],
                "units": scenario["potential_units"],
                "hours": scenario["estimated_worker_hours"],
                "neighborhoods": scenario["neighborhood_count"],
                "property_ids": scenario["property_ids"],
                "summary": f"{scenario['affected_count']} candidate properties · {scenario['potential_units']} potential units · {scenario['estimated_worker_hours']:,} estimated worker-hours · {scenario['neighborhood_count']} neighborhoods",
                "label": "Hypothetical scenario. Not a funding recommendation.",
                "source_status": "DEMO",
            },
            {
                "id": 7,
                "start": 95,
                "end": 110,
                "kicker": "The ask",
                "title": "The one number we can't show yet: how many skilled workers are on the bench.",
                "banner": "DEMO — simulated. Real availability requires authorization from participating unions.",
                "workforce_total_demo": capacity["workforce_workers"],
                "asks": [
                    {"who": "Trades", "text": "Authorize aggregate, trade-level counts — opt-in, revocable, dispatch unchanged.", "voluntary": True},
                    {"who": "City and County", "text": "A first-notice convention for publicly funded rehab, and a pilot rehab bundle.", "voluntary": True},
                    {"who": "Everyone", "text": "BenchBridge identifies demand; hiring halls keep dispatch.", "voluntary": True},
                ],
            },
            {
                "id": 8,
                "start": 110,
                "end": 120,
                "kicker": "Close",
                "title": "BENCHBRIDGE",
                "body": "Buildings are waiting. Workers are waiting. People are waiting for housing.",
                "close": "Connect the capacity that's already here.",
            },
        ],
        "focus": {
            "property_id": featured["property_id"],
            "longitude": featured["longitude"],
            "latitude": featured["latitude"],
            "official_planning_capacity": featured["housing_element_capacity"],
            "modeled_units": featured["candidate_potential_units"],
            "hours": featured["estimated_worker_hours"],
            "funding_gap": featured["modeled_funding_gap"],
            "packages": featured["work_package_count"],
        },
        "citywide_units": capacity["potential_units"],
        "workforce_total": capacity["workforce_workers"],
        "block_check": {
            "properties": block["property_count"],
            "units": block["potential_units"],
            "hours": block["estimated_worker_hours"],
        },
    }
