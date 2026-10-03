import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.engine import Engine

ROOT = Path(__file__).resolve().parents[1]
client = TestClient(app)


def test_suppression_on_publication_endpoint():
    body = client.get("/api/workforce").json()
    env = next(row for row in body["rows"] if row["trade"] == "environmental_specialist")
    assert env["count"] is None
    assert env["suppressed"] is True
    assert env["display"] == "<5"
    assert "true_count" not in json.dumps(env)
    for row in body["rows"]:
        if row["count"] is not None:
            assert row["count"] >= 5


def test_partner_mode_does_not_fall_back(monkeypatch):
    monkeypatch.setenv("WORKFORCE_SOURCE_MODE", "PARTNER_AGGREGATE")
    body = client.get("/api/workforce").json()
    assert body["message"] == "Partner data required"
    assert body["rows"] == []
    assert "12" not in json.dumps(body["rows"])


def test_no_asbestos_from_age_and_no_approval_language():
    body = client.get("/api/properties/BB-001").json()
    assert body["asbestos_status"] == "UNKNOWN"
    assert "UNKNOWN" in body["asbestos_note"]
    assert body["year_built"] is not None
    blob = json.dumps(body).lower()
    assert "approved homeless" not in blob
    assert "habitable" not in blob
    assert "not official dispatch" in body["crew"]["label"].lower()
    assert "unknown" in json.dumps(body["crew"]["contractors"]).lower()


def test_no_personal_workforce_fields():
    import pyarrow.parquet as pq
    table = pq.read_table(ROOT / "data" / "processed" / "workforce_demo.parquet")
    banned = {"name", "first_name", "last_name", "ssn", "dob", "phone", "email", "address", "race", "gender"}
    assert banned.isdisjoint(set(table.column_names))


def test_methodology_has_required_sections():
    text = (ROOT / "METHODOLOGY.md").read_text()
    assert "Verify current status" in text
    assert "40% fewer" not in text
    assert "WHY A LOCAL MIGHT OPT IN" in text
    assert "BenchBridge takes no position" in text
    assert "SUPPRESSION_MIN = 5" in text or "under 5" in text


def test_city_owned_extract_is_oakland_only():
    fc = json.loads((ROOT / "data" / "geo" / "city_owned.geojson").read_text())
    for feature in fc["features"]:
        city = (feature["properties"].get("CITY") or "Oakland").lower()
        assert city == "oakland"
        assert "EMAIL" not in feature["properties"]
        assert "PHONE" not in feature["properties"]


def test_demo_duration_and_targets_from_api():
    body = client.get("/api/demo").json()
    assert body["total_seconds"] <= 120
    assert sum(step["end"] - step["start"] for step in body["steps"]) == 120
    featured_step = body["steps"][1]
    assert "24" in featured_step["title"]
    crew = body["steps"][2]
    assert crew["gap"] == -1
    scenario = body["steps"][5]
    assert scenario["affected"] == 3
    assert scenario["units"] == 41
    assert scenario["hours"] == 4300
    assert "not a funding recommendation" in scenario["label"].lower()


def test_frontend_has_no_hardcoded_headlines():
    banned = ["2,140", "2140", "4,410", "4410", "82,000", "$82,000", "5,800", "4,300", "4,410"]
    root = ROOT / "frontend"
    if not root.exists():
        return
    blob = []
    for path in root.rglob("*"):
        if path.suffix not in {".ts", ".tsx"} or "node_modules" in path.parts or ".next" in path.parts:
            continue
        blob.append(path.read_text())
    text = "\n".join(blob)
    for item in banned:
        assert item not in text
    lowered = text.lower()
    assert "approved homeless" not in lowered
    assert "asbestos-free" not in lowered
    assert "live availability" not in lowered
    assert "unions must" not in lowered
    assert "has agreed to participate" not in lowered
