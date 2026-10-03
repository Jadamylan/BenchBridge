"""Aggregate workforce availability and small-cell suppression."""

from __future__ import annotations

from datetime import datetime, timezone

SUPPRESSION_MIN = 5


class PartnerDataRequired(Exception):
    """Raised when a non-demo workforce mode has no configured provider."""


def availability_rows(rows: list[dict], source_id: str = "demo_workforce", source_status: str = "DEMO") -> list[dict]:
    as_of = datetime(2026, 10, 3, tzinfo=timezone.utc).isoformat()
    payload = []
    for row in rows:
        count = int(row["count"])
        payload.append({
            "trade": row["trade"],
            "label": row.get("label") or row["trade"],
            "classification": row.get("classification") or "all",
            "count": count,
            "suppressed": False,
            "as_of": as_of,
            "source_id": source_id,
            "source_status": source_status,
        })
    return payload


def public_availability(rows: list[dict]) -> list[dict]:
    """Drop true counts of 1–4 before a payload can reach the client."""
    published = []
    for row in rows:
        count = int(row["count"])
        item = {key: value for key, value in row.items() if key != "count"}
        if 0 < count < SUPPRESSION_MIN:
            item["count"] = None
            item["suppressed"] = True
            item["display"] = "<5"
        else:
            item["count"] = count
            item["suppressed"] = False
            item["display"] = str(count)
        published.append(item)
    return published
