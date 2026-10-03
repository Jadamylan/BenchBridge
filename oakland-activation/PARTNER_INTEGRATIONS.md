# Partner integrations

Nothing in this file is an agreement. No union, hiring hall, council, or city registry is connected.

## AuthorizedUnionWorkforceProvider

Stub. A participating local, or the Alameda County Building and Construction Trades Council if its affiliates asked it to publish, could send a weekly aggregate:

`trade`, `classification` (`journey`, `apprentice`, or `all`), `count` or null, `suppressed`, `as_of`, `source_id`, `source_status`.

Counts from 1 to 4 are suppressed (`<5`). Names, addresses, and demographics are out of scope. Dispatch stays with the hall. The feed is opt-in and revocable.

San Francisco's Building Trades Council has published an aggregate survey of affiliate out-of-work lists. That is a precedent for a council-level aggregate, not an Alameda County commitment. The cached 2023 figure is unverified in this build and is labeled precedent only.

If `WORKFORCE_SOURCE_MODE` is `PARTNER_AGGREGATE` or `CITY_REGISTRY` and no provider is configured, the API returns `Partner data required` and does not substitute the demo bench.

## CityRegistryAggregateProvider

Stub. With City cooperation, this would be aggregate counts by trade from the local-resident construction job-seeker registry. No individual records.

## OaklandLocalHireProvider

Stub. The Local Employment Program is policy context. It is not a bench feed.

## What a local would control

Opt in. Pause or revoke at any time. Aggregate by trade only. Dispatch rules unchanged.

## Pathways

Discussion tiers only, on `/methodology`. BenchBridge takes no position on labor agreements.
