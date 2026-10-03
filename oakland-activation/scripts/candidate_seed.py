"""Demo rehabilitation overlay.

Public parcel facts are joined from cached GIS at build time.
Every number in this file is a modeled hackathon input. The engine
recomputes hours, gaps, crew math, and citywide totals from these rows.
"""

from __future__ import annotations


def pkg(task, trade, workers, hours, cost, specialist=False, category=None):
    return {
        "task": task,
        "trade": trade,
        "category": category or trade,
        "estimated_workers": workers,
        "estimated_worker_hours": hours,
        "estimated_cost": cost,
        "specialist_required": specialist,
        "source_type": "DEMO",
    }


# Workforce seed. True counts live in the engine. Cells of 1–4 are
# suppressed on the publication endpoint.
WORKFORCE = [
    {"trade": "plumbing", "label": "Plumbers", "classification": "all", "count": 12},
    {"trade": "electrical", "label": "Electricians", "classification": "all", "count": 8},
    {"trade": "carpentry", "label": "Carpenters", "classification": "all", "count": 17},
    {"trade": "laborers", "label": "Laborers", "classification": "all", "count": 20},
    {"trade": "hvac", "label": "HVAC technicians", "classification": "all", "count": 6},
    {
        "trade": "environmental_specialist",
        "label": "Environmental specialists",
        "classification": "all",
        "count": 1,
    },
]

# Illustrative firms only. License numbers are synthetic DEMO- prefixes.
# They are not CSLB records and not an endorsement.
DEMO_CONTRACTORS = [
    {"contractor_id": "DC-01", "business_name": "Demo Harbor Mechanical", "license_number": "DEMO-PLB-1001", "classification": "C-36 Plumbing", "status": "Illustrative", "city": "Oakland", "zip": "94607", "trades": ["plumbing"], "source_type": "DEMO"},
    {"contractor_id": "DC-02", "business_name": "Demo Estuary Electric", "license_number": "DEMO-ELE-1002", "classification": "C-10 Electrical", "status": "Illustrative", "city": "Oakland", "zip": "94612", "trades": ["electrical"], "source_type": "DEMO"},
    {"contractor_id": "DC-03", "business_name": "Demo Mandela Framing", "license_number": "DEMO-CRP-1003", "classification": "C-5 Framing / Carpentry", "status": "Illustrative", "city": "Oakland", "zip": "94607", "trades": ["carpentry"], "source_type": "DEMO"},
    {"contractor_id": "DC-04", "business_name": "Demo Seventh Street Labor", "license_number": "DEMO-LAB-1004", "classification": "C-8 Concrete / labor support", "status": "Illustrative", "city": "Oakland", "zip": "94607", "trades": ["laborers"], "source_type": "DEMO"},
    {"contractor_id": "DC-05", "business_name": "Demo Bay HVAC", "license_number": "DEMO-HVC-1005", "classification": "C-20 HVAC", "status": "Illustrative", "city": "San Leandro", "zip": "94577", "trades": ["hvac"], "source_type": "DEMO"},
    {"contractor_id": "DC-06", "business_name": "Demo Remediation Crew Co.", "license_number": "DEMO-ENV-1006", "classification": "C-22 Asbestos / C-61 limited", "status": "Illustrative", "city": "Oakland", "zip": "94621", "trades": ["environmental_specialist"], "source_type": "DEMO"},
    {"contractor_id": "DC-07", "business_name": "Demo Fruitvale Builders", "license_number": "DEMO-B-1007", "classification": "B General Building", "status": "Illustrative", "city": "Oakland", "zip": "94601", "trades": ["carpentry", "plumbing"], "source_type": "DEMO"},
    {"contractor_id": "DC-08", "business_name": "Demo East Oakland Air", "license_number": "DEMO-HVC-1008", "classification": "C-20 HVAC", "status": "Illustrative", "city": "Oakland", "zip": "94621", "trades": ["hvac", "electrical"], "source_type": "DEMO"},
]

CANDIDATES = [
    {
        "property_id": "BB-001",
        "match": "1300 7TH ST",
        "neighborhood": "West Oakland",
        "block_id": "west-oakland-7th",
        "potential_units": 24,
        "identified_funds": 175_000,
        "primary_blocker": "ENVIRONMENTAL_REMEDIATION",
        "tasks": [
            pkg("Replace domestic water and waste lines", "plumbing", 2, 420, 45_000, category="plumbing"),
            pkg("Upgrade service, panels, and branch circuits", "electrical", 3, 510, 62_000, category="electrical"),
            pkg("Frame and enclose modeled unit shells", "carpentry", 4, 680, 78_000, category="carpentry"),
            pkg("Environmental site assessment (modeled scope)", "environmental_specialist", 1, 180, 18_000, specialist=True, category="environmental assessment"),
            pkg("Modeled asbestos and lead remediation scope", "environmental_specialist", 1, 350, 54_000, specialist=True, category="asbestos assessment/remediation"),
        ],
    },
    {
        "property_id": "BB-002",
        "match": "1255 7TH ST",
        "neighborhood": "West Oakland",
        "block_id": "west-oakland-7th",
        "potential_units": 12,
        "identified_funds": 112_000,
        "primary_blocker": "FUNDING_GAP",
        "tasks": [
            pkg("Repipe wet stacks", "plumbing", 2, 500, 55_000, category="plumbing"),
            pkg("Replace distribution panels", "electrical", 2, 480, 60_000, category="electrical"),
            pkg("Patch roof and parapet", "laborers", 3, 420, 45_000, category="roofing"),
        ],
    },
    {
        "property_id": "BB-003",
        "match": "1708 WOOD ST",
        "neighborhood": "West Oakland",
        "block_id": "west-oakland-7th",
        "potential_units": 11,
        "identified_funds": 90_000,
        "primary_blocker": "PLANNING_REVIEW",
        "tasks": [
            pkg("Interior partitions for modeled units", "carpentry", 3, 800, 70_000, category="carpentry"),
            pkg("Life-safety electrical", "electrical", 2, 700, 64_000, category="fire/life safety"),
            pkg("Plumbing rough-in", "plumbing", 2, 460, 48_000, category="plumbing"),
            pkg("Site cleanup and haul-off", "laborers", 4, 300, 22_000, category="carpentry"),
        ],
    },
    {
        "property_id": "BB-004",
        "match": "2257 INTERNATIONAL BLVD",
        "neighborhood": "San Antonio",
        "block_id": None,
        "potential_units": 14,
        "identified_funds": 150_000,
        "primary_blocker": "FUNDING_GAP",
        "tasks": [
            pkg("Service upgrade", "electrical", 2, 600, 80_000, category="electrical"),
            pkg("Structural carpentry", "carpentry", 3, 500, 75_000, category="carpentry"),
            pkg("HVAC replacement", "hvac", 2, 400, 65_000, category="HVAC"),
        ],
    },
    {
        "property_id": "BB-005",
        "match": "796 66TH AVE",
        "neighborhood": "East Oakland",
        "block_id": None,
        "potential_units": 15,
        "identified_funds": 160_000,
        "primary_blocker": "FUNDING_GAP",
        "tasks": [
            pkg("Plumbing replacement", "plumbing", 2, 450, 70_000, category="plumbing"),
            pkg("Unit carpentry", "carpentry", 3, 550, 95_000, category="carpentry"),
            pkg("Heating and ventilation", "hvac", 2, 400, 85_000, category="HVAC"),
        ],
    },
    {
        "property_id": "BB-006",
        "match": "1443 ALICE ST",
        "neighborhood": "Downtown",
        "block_id": None,
        "potential_units": 8,
        "identified_funds": 130_000,
        "primary_blocker": "FUNDING_GAP",
        "tasks": [
            pkg("Garage-to-residential framing study scope", "carpentry", 3, 400, 220_000, category="carpentry"),
            pkg("Electrical redesign", "electrical", 2, 280, 160_000, category="electrical"),
            pkg("Plumbing cores", "plumbing", 2, 180, 100_000, category="plumbing"),
        ],
    },
    {
        "property_id": "BB-007",
        "match": "48 5TH AVE",
        "neighborhood": "San Antonio",
        "block_id": None,
        "potential_units": 6,
        "identified_funds": 40_000,
        "primary_blocker": "SPECIALIZED_WORKFORCE_GAP",
        "tasks": [
            pkg("Modeled remediation support", "environmental_specialist", 1, 220, 48_000, specialist=True, category="environmental assessment"),
            pkg("Carpentry", "carpentry", 2, 300, 36_000, category="carpentry"),
            pkg("Electrical", "electrical", 2, 220, 30_000, category="electrical"),
        ],
    },
    {
        "property_id": "BB-008",
        "match": "113 10TH ST",
        "neighborhood": "Jack London",
        "block_id": None,
        "potential_units": 5,
        "identified_funds": 20_000,
        "primary_blocker": "ASSESSMENT_NEEDED",
        "tasks": [
            pkg("Condition assessment walkthrough (modeled)", "laborers", 2, 160, 12_000, category="environmental assessment"),
            pkg("Roofing observation", "laborers", 2, 200, 18_000, category="roofing"),
            pkg("Electrical safety check", "electrical", 1, 250, 22_000, category="electrical"),
        ],
    },
    {
        "property_id": "BB-009",
        "match": "1218 MILLER AVE",
        "neighborhood": "Fruitvale",
        "block_id": None,
        "potential_units": 7,
        "identified_funds": 55_000,
        "primary_blocker": "ENVIRONMENTAL_REVIEW",
        "tasks": [
            pkg("Modeled phase I environmental scope", "environmental_specialist", 1, 240, 40_000, specialist=True, category="environmental assessment"),
            pkg("Plumbing", "plumbing", 2, 350, 42_000, category="plumbing"),
            pkg("Carpentry", "carpentry", 2, 300, 38_000, category="carpentry"),
        ],
    },
    {
        "property_id": "BB-010",
        "match": "102 10TH ST",
        "neighborhood": "Jack London",
        "block_id": None,
        "potential_units": 4,
        "identified_funds": 80_000,
        "primary_blocker": "READY_FOR_FURTHER_EVALUATION",
        "tasks": [
            pkg("Light carpentry", "carpentry", 2, 220, 28_000, category="carpentry"),
            pkg("Electrical devices", "electrical", 1, 160, 18_000, category="electrical"),
            pkg("ADA path of travel (modeled)", "laborers", 2, 100, 16_000, category="ADA improvements"),
        ],
    },
    {
        "property_id": "BB-011",
        "match": "419 4TH ST",
        "neighborhood": "Jack London",
        "block_id": None,
        "potential_units": 6,
        "identified_funds": 70_000,
        "primary_blocker": "PLANNING_REVIEW",
        "tasks": [
            pkg("Warehouse infill framing", "carpentry", 3, 360, 48_000, category="carpentry"),
            pkg("Electrical", "electrical", 2, 200, 32_000, category="electrical"),
            pkg("Plumbing", "plumbing", 2, 160, 24_000, category="plumbing"),
        ],
    },
    {
        "property_id": "BB-012",
        "match": "2103 SAN PABLO AVE",
        "neighborhood": "Uptown",
        "block_id": None,
        "potential_units": 8,
        "identified_funds": 140_000,
        "primary_blocker": "REHABILITATION_UNDERWAY",
        "tasks": [
            pkg("Ongoing carpentry package (modeled)", "carpentry", 3, 480, 60_000, category="carpentry"),
            pkg("HVAC", "hvac", 2, 280, 44_000, category="HVAC"),
            pkg("Electrical", "electrical", 2, 250, 36_000, category="electrical"),
        ],
    },
    {
        "property_id": "BB-013",
        "match": "4432 TELEGRAPH AVE",
        "neighborhood": "North Oakland",
        "block_id": None,
        "potential_units": 5,
        "identified_funds": 25_000,
        "primary_blocker": "ASSESSMENT_NEEDED",
        "tasks": [
            pkg("Retail-to-residential assessment (modeled)", "laborers", 2, 180, 14_000, category="environmental assessment"),
            pkg("Plumbing", "plumbing", 1, 220, 26_000, category="plumbing"),
            pkg("Carpentry", "carpentry", 2, 240, 28_000, category="carpentry"),
        ],
    },
    {
        "property_id": "BB-014",
        "match": "525 21ST ST",
        "neighborhood": "Uptown",
        "block_id": None,
        "potential_units": 4,
        "identified_funds": 96_000,
        "primary_blocker": "ACTIVATED",
        "tasks": [
            pkg("Completed-stage carpentry (modeled stage)", "carpentry", 2, 200, 40_000, category="carpentry"),
            pkg("Electrical trim", "electrical", 1, 130, 28_000, category="electrical"),
            pkg("Plumbing trim", "plumbing", 1, 100, 28_000, category="plumbing"),
        ],
    },
    {
        "property_id": "BB-015",
        "match": "1600 HARRISON ST",
        "neighborhood": "Downtown",
        "block_id": None,
        "potential_units": 5,
        "identified_funds": 30_000,
        "primary_blocker": "ENVIRONMENTAL_REVIEW",
        "tasks": [
            pkg("Modeled environmental review support", "environmental_specialist", 1, 200, 36_000, specialist=True, category="environmental assessment"),
            pkg("Electrical", "electrical", 2, 280, 34_000, category="electrical"),
            pkg("Carpentry", "carpentry", 2, 290, 32_000, category="carpentry"),
        ],
    },
    {
        "property_id": "BB-016",
        "match": "616 14TH ST",
        "neighborhood": "Downtown",
        "block_id": None,
        "potential_units": 6,
        "identified_funds": 48_000,
        "primary_blocker": "PLANNING_REVIEW",
        "tasks": [
            pkg("Life safety", "electrical", 2, 260, 36_000, category="fire/life safety"),
            pkg("ADA improvements (modeled)", "laborers", 2, 180, 22_000, category="ADA improvements"),
            pkg("Plumbing", "plumbing", 2, 250, 30_000, category="plumbing"),
        ],
    },
    {
        "property_id": "BB-017",
        "match": "3855 WEST ST",
        "neighborhood": "North Oakland",
        "block_id": None,
        "potential_units": 4,
        "identified_funds": 18_000,
        "primary_blocker": "SPECIALIZED_WORKFORCE_GAP",
        "tasks": [
            pkg("Modeled specialist assessment", "environmental_specialist", 1, 160, 28_000, specialist=True, category="lead assessment/remediation"),
            pkg("Carpentry", "carpentry", 2, 200, 24_000, category="carpentry"),
            pkg("HVAC", "hvac", 1, 160, 20_000, category="HVAC"),
        ],
    },
    {
        "property_id": "BB-018",
        "match": "1440 23RD AVE",
        "neighborhood": "San Antonio",
        "block_id": None,
        "potential_units": 4,
        "identified_funds": 60_000,
        "primary_blocker": "READY_FOR_FURTHER_EVALUATION",
        "tasks": [
            pkg("Storefront carpentry", "carpentry", 2, 180, 22_000, category="carpentry"),
            pkg("Electrical", "electrical", 1, 140, 16_000, category="electrical"),
            pkg("Plumbing", "plumbing", 1, 130, 14_000, category="plumbing"),
        ],
    },
]
