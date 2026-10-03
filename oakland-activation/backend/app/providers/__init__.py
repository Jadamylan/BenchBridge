"""Source adapters. DEMO_MODE reads cached snapshots only."""

from __future__ import annotations

from backend.app.services.workforce import PartnerDataRequired


class SnapshotProvider:
    provider_id = "snapshot"
    retrieval_method = "BULK_DOWNLOAD"

    def __init__(self, engine):
        self.engine = engine


class AlamedaCountyOpenDataProvider(SnapshotProvider):
    """County parcel attributes cached from the public FeatureServer."""

    provider_id = "ac_parcels"

    def oakland_parcels_for(self, property_id: str) -> list[dict]:
        return self.engine._county.get(property_id, [])


class OaklandParcelProvider(AlamedaCountyOpenDataProvider):
    provider_id = "oakland_parcels"


class OaklandCityOwnedPropertyProvider(SnapshotProvider):
    provider_id = "oakland_city_owned"

    def feature_collection(self) -> dict:
        return self.engine.geo("city_owned.geojson")


class OaklandHousingElementProvider(SnapshotProvider):
    provider_id = "oakland_housing_element"

    def feature_collection(self) -> dict:
        return self.engine.geo("housing_element.geojson")


class OaklandPlanningProvider(SnapshotProvider):
    provider_id = "oakland_planning"

    def signals(self, record: dict) -> dict:
        return {
            "zoning": record.get("zoning"),
            "general_plan_code": record.get("general_plan_code"),
            "historic_status": record.get("historic_status") or "UNKNOWN",
            "note": "Planning signals from the cached Housing Element extract. Not a zoning determination.",
            "status": "PUBLIC",
        }


class EnvironmentalDataProvider(SnapshotProvider):
    provider_id = "environmental_records"

    def records(self) -> list[dict]:
        return []


class CSLBContractorProvider(SnapshotProvider):
    provider_id = "cslb"
    retrieval_method = "MANUAL_SNAPSHOT"

    def listings(self) -> list[dict]:
        return []


class AlamedaQualifiedContractorProvider(SnapshotProvider):
    provider_id = "alameda_qualified_contractors"
    retrieval_method = "MANUAL_SNAPSHOT"

    def listings(self) -> list[dict]:
        return []


class DIRTradeProvider(SnapshotProvider):
    provider_id = "dir_prevailing_wage"

    def notice(self) -> str:
        return "WAGE REQUIREMENTS: Prevailing wage / labor requirements may apply. Verify project-specific requirements."


class OaklandLocalHireProvider(SnapshotProvider):
    provider_id = "oakland_local_hire"
    retrieval_method = "STUB"

    def availability(self):
        raise PartnerDataRequired("Partner data required")


class WorkforceAvailabilityProvider:
    def get_aggregate_availability(self, as_of=None):
        raise NotImplementedError


class DemoWorkforceProvider(WorkforceAvailabilityProvider):
    source_status = "DEMO"

    def __init__(self, engine):
        self.engine = engine

    def get_aggregate_availability(self, as_of=None):
        return self.engine.workforce_true()


class AuthorizedUnionWorkforceProvider(WorkforceAvailabilityProvider):
    source_status = "PARTNER_REQUIRED"

    def get_aggregate_availability(self, as_of=None):
        raise PartnerDataRequired("Partner data required")


class CityRegistryAggregateProvider(WorkforceAvailabilityProvider):
    source_status = "PARTNER_REQUIRED"

    def get_aggregate_availability(self, as_of=None):
        raise PartnerDataRequired("Partner data required")


def workforce_provider(mode: str, engine):
    if mode == "DEMO":
        return DemoWorkforceProvider(engine)
    if mode == "PARTNER_AGGREGATE":
        return AuthorizedUnionWorkforceProvider()
    if mode == "CITY_REGISTRY":
        return CityRegistryAggregateProvider()
    raise PartnerDataRequired("Partner data required")
