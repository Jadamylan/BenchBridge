import socket

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.netguard import install_demo_network_guard

client = TestClient(app)


def test_demo_mode_blocks_outbound_sockets():
    install_demo_network_guard()
    try:
        socket.create_connection(("example.com", 443), timeout=2)
    except RuntimeError as exc:
        assert "DEMO_MODE" in str(exc)
    else:
        raise AssertionError("outbound connection was allowed")


def test_demo_routes_serve_without_network():
    for path in ["/api/health", "/api/map", "/api/demo", "/api/workforce", "/api/properties/BB-001", "/api/scenarios", "/api/bottlenecks", "/api/context-stats", "/api/blocks/west-oakland-7th"]:
        response = client.get(path)
        assert response.status_code == 200, path
    health = client.get("/api/health").json()
    assert health["demo_mode"] is True
    scenario = client.post("/api/scenarios/run", json={"scenario_id": "funding_500k"}).json()
    assert scenario["affected_count"] == 3
