import json

from backend.app.services.engine import Engine


def engine():
    return Engine()


def test_seed_targets():
    eng = engine()
    assert eng.citywide_units() == 148
    assert len(eng.properties) >= 15
    assert len(eng.properties) <= 25
    assert eng.workforce_total() == 64

    featured = eng.property("BB-001")
    assert featured["neighborhood"] == "West Oakland"
    assert featured["candidate_potential_units"] == 24
    assert featured["work_package_count"] == 5
    assert featured["estimated_worker_hours"] == 2140
    assert featured["modeled_funding_gap"] == 82_000
    assert featured["primary_blocker"] == "ENVIRONMENTAL_REMEDIATION"
    assert featured["potential_units_source"] == "DEMO"

    crew = eng.crew("BB-001")
    by_trade = {line["trade"]: line for line in crew["lines"]}
    assert by_trade["plumbing"]["needed_workers"] == 2
    assert by_trade["plumbing"]["demo_available"] == 12
    assert by_trade["electrical"]["needed_workers"] == 3
    assert by_trade["electrical"]["demo_available"] == 8
    assert by_trade["carpentry"]["needed_workers"] == 4
    assert by_trade["carpentry"]["demo_available"] == 17
    assert by_trade["environmental_specialist"]["needed_workers"] == 2
    assert by_trade["environmental_specialist"]["demo_available"] == 1
    assert by_trade["environmental_specialist"]["gap"] == -1
    assert "not official dispatch" in crew["label"]

    block = eng.block_summary("west-oakland-7th")
    assert block["property_count"] == 3
    assert block["potential_units"] == 47
    assert block["estimated_worker_hours"] == 5800
    assert block["blocker_counts"]["environmental"] == 1
    assert block["blocker_counts"]["funding"] == 1
    assert block["blocker_counts"]["planning"] == 1

    scenario = eng.scenario_funding(500_000)
    assert scenario["affected_count"] == 3
    assert scenario["potential_units"] == 41
    assert scenario["estimated_worker_hours"] == 4300
    assert scenario["neighborhood_count"] == 3
    assert "BB-001" not in scenario["property_ids"]


def test_context_stats_schema():
    stats = engine().context_stats()
    for key, entry in stats.items():
        assert entry["source_url"]
        assert entry["retrieved_at"]
        assert entry["status"] in {"PUBLIC", "DEMO", "PARTNER_REQUIRED"}
        assert "verified" in entry
        assert entry["caveat"]


def test_labels_persist():
    featured = engine().public_property(engine().property("BB-001"))
    statuses = {item["status"] for item in featured["sources"]}
    assert "PUBLIC" in statuses
    assert "DEMO" in statuses
    assert "PARTNER_REQUIRED" in statuses
    assert featured["asbestos_status"] == "UNKNOWN"
    assert featured["year_built"] != 1956 or featured["asbestos_status"] != "true"


def test_scenarios_do_not_mutate_baseline():
    eng = engine()
    before = eng.property("BB-001")["modeled_funding_gap"]
    eng.scenario_funding(500_000)
    eng.scenario_add_workers("plumbing", 10)
    eng.scenario_resolve_environmental("BB-001")
    assert eng.property("BB-001")["modeled_funding_gap"] == before
    assert eng.workforce_total() == 64


def test_plumber_scenario_is_deterministic():
    result = engine().scenario_add_workers("plumbing", 10)
    plumbers = next(row for row in result["supply"] if row["trade"] == "plumbing")
    assert plumbers["count"] == 22
    assert result["baseline_unchanged"] is True


def test_bottlenecks_sum_to_all_candidates():
    eng = engine()
    groups = eng.bottlenecks()
    assert sum(group["count"] for group in groups) == len(eng.properties)
    assert abs(sum(group["percent"] for group in groups) - 100) < 0.1


def test_capacity_follows_filter():
    eng = engine()
    all_rows = eng.capacity()
    funded = eng.capacity(eng.filter_properties(blockers=["FUNDING_GAP"]))
    assert all_rows["potential_units"] == 148
    assert funded["potential_units"] < all_rows["potential_units"]
    assert funded["property_count"] == 4


def test_full_filter_workforce_is_seed_total():
    eng = engine()
    assert eng.workforce_capacity(eng.properties) == 64
