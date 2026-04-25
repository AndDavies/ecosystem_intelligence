# Arctic Domain Awareness Real-Data Pilot

- Batch ID: `pilot-arctic-domain-awareness-2026-04-24`
- Candidate file: `data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json`
- Created: `2026-04-24T00:00:00.000Z`
- Validation status: **Ready for human review**
- Counts: 6 companies, 6 capabilities, 8 mappings, 9 sources, 15 snippets, 20 citations
- Use cases: `use-case-1`, `use-case-3`, `use-case-4`, `use-case-5`
- Domains: `domain-1`, `domain-2`, `domain-4`

## Research Scope

Small public-source pilot for Arctic domain awareness, underwater ISR, autonomous patrol, and edge mission software. This batch is reviewable candidate data only and is not approved seed data.

## Guardrail Notes

- Public-source alignment only; this batch does not imply classified CAF, DND, NORAD, NATO, or procurement targeting.
- Company and capability records use canonical public URLs and paraphrased evidence snippets.
- Candidate records are intentionally staged outside supabase/seed until a human reviewer approves import.

## Validation

- Errors: 0
- Warnings: 0

### Errors

- None

### Warnings

- None

## Reviewer Checklist

- [ ] Company records are real organizations and are not duplicates of existing seed records.
- [ ] Capability summaries are public-source grounded and do not imply classified alignment.
- [ ] Use-case mappings are realistic and not stretched to fill the catalog.
- [ ] High relevance or high defence relevance mappings have enough evidence to justify their confidence.
- [ ] Source URLs are canonical, useful to an analyst, and acceptable for public-source traceability.
- [ ] Promotion should proceed into `supabase/seed`.

## Companies

| Company | Geography | HQ | Confidence | Citations | Rationale |
| --- | --- | --- | --- | --- | --- |
| Kraken Robotics | canada | St. John's Newfoundland and Labrador Canada | high | 1 | Official product and company release pages describe synthetic aperture sonar and subsea systems with defence and maritime security relevance. |
| MDA Space | canada | Brampton Ontario Canada | high | 1 | Official MDA pages and public contract reporting support the Earth observation and maritime awareness connection. |
| Cellula Robotics | canada | Burnaby British Columbia Canada | moderate | 1 | Official product pages support long-endurance AUV capability, but mission fit still needs operator validation. |
| Kongsberg Geospatial | canada | Ottawa Ontario Canada | high | 1 | Official product pages describe IRIS Terminal and related unmanned systems visualization functions. |
| GeoSpectrum Technologies | canada | Dartmouth Nova Scotia Canada | high | 1 | Official GeoSpectrum TRAPS page describes active-passive sonar capability for defence and surveillance use. |
| Open Ocean Robotics | canada | Victoria British Columbia Canada | moderate | 1 | Official company pages and industry reporting support maritime awareness relevance, but operational maturity should be validated before procurement-facing treatment. |

## Capabilities

| Capability | Company | Domain | Confidence | Citations | Rationale |
| --- | --- | --- | --- | --- | --- |
| KATFISH Towed Synthetic Aperture Sonar | Kraken Robotics | domain-2 | high | 1 | Official product documentation describes resolution, area coverage, and real-time SAS data characteristics. |
| MDA CHORUS Synthetic Aperture Radar Constellation | MDA Space | domain-2 | high | 1 | Official CHORUS page describes the SAR constellation design and public reporting connects MDA services to maritime awareness. |
| Envoy Long-Endurance Autonomous Underwater Vehicle | Cellula Robotics | domain-1 | moderate | 1 | Official product page supports endurance and AUV framing, while defence mission suitability still needs validation evidence. |
| IRIS Terminal Airspace Visualization | Kongsberg Geospatial | domain-4 | high | 1 | Official product page describes sensor and telemetry fusion for airspace management and unmanned operations. |
| TRAPS Towed Reelable Active Passive Sonar | GeoSpectrum Technologies | domain-2 | high | 1 | Official TRAPS page describes active-passive sonar functions and platform applicability. |
| Autonomous USV Maritime Awareness Platform | Open Ocean Robotics | domain-1 | moderate | 1 | Official and industry sources support maritime awareness relevance, but defence operating fit should remain validation-led. |

## Use-Case Mappings

| Capability | Use case | Pathway | Relevance | Defence | Confidence | Citations | Why it matters |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KATFISH Towed Synthetic Aperture Sonar | use-case-3 | scale | high | high | high | 1 | High-resolution towed SAS can help operators characterize underwater areas where persistent undersea awareness and seabed context are operationally valuable. |
| KATFISH Towed Synthetic Aperture Sonar | use-case-1 | validate | medium | high | moderate | 1 | The capability could support Arctic maritime awareness where undersea survey and detection gaps need source-backed validation in northern conditions. |
| MDA CHORUS Synthetic Aperture Radar Constellation | use-case-1 | scale | high | high | high | 1 | All-weather SAR observation can strengthen Arctic awareness by adding persistent overhead context where weather and distance limit other collection methods. |
| Envoy Long-Endurance Autonomous Underwater Vehicle | use-case-3 | validate | high | medium | moderate | 1 | A long-endurance AUV can extend underwater survey and patrol reach, but mission value depends on validated payloads, recovery concepts, and operating conditions. |
| IRIS Terminal Airspace Visualization | use-case-4 | scale | high | medium | high | 1 | Autonomous patrol trials need reliable local awareness and deconfliction, especially when multiple telemetry and sensor feeds must be interpreted together. |
| IRIS Terminal Airspace Visualization | use-case-5 | scale | medium | medium | moderate | 1 | A common visualization layer can reduce operator burden when telemetry, sensor, and airspace context would otherwise be split across separate tools. |
| TRAPS Towed Reelable Active Passive Sonar | use-case-3 | scale | high | high | high | 1 | Compact active-passive sonar can add underwater target detection and tracking to platforms that need persistent awareness without large dedicated sonar suites. |
| Autonomous USV Maritime Awareness Platform | use-case-1 | validate | medium | medium | moderate | 1 | Persistent uncrewed surface collection could extend maritime awareness in sparse regions, but Arctic-specific reliability and payload integration need validation. |

## Sources

| Source | Publisher | Type | Published | URL |
| --- | --- | --- | --- | --- |
| KATFISH Towed SAS | Kraken Robotics | company_website | n/a | https://www.krakenrobotics.com/products/katfish |
| Kraken Robotics Announces Orders For Synthetic Aperture Sonar And Subsea Batteries | Kraken Robotics | company_news | 2025-12-02T00:00:00.000Z | https://www.krakenrobotics.com/news-releases/kraken-robotics-announces-12-million-in-orders-for-synthetic-aperture-sonar-and-subsea-batteries/ |
| MDA CHORUS | MDA Space | company_website | n/a | https://mda.space/chorus/ |
| Government Of Canada Extends MDA Space Contract Providing Continuous Space-Based Maritime Awareness And Security | PR Newswire | industry_news | n/a | https://www.prnewswire.com/news-releases/government-of-canada-extends-mda-space-contract-providing-continuous-space-based-maritime-awareness-and-security-302493532.html |
| Envoy AUV | Cellula Robotics | company_website | n/a | https://cellula.com/envoy-auv/ |
| IRIS Terminal | Kongsberg Geospatial | company_website | n/a | https://www.kongsberggeospatial.com/products/iris-terminal |
| TRAPS Towed Reelable Active Passive Sonar | GeoSpectrum Technologies | company_website | n/a | https://geospectrum.ca/catalog/defence/surface-systems/traps-towed-reelable-active-passive-sonar/ |
| Open Ocean Robotics | Open Ocean Robotics | company_website | n/a | https://www.openoceanrobotics.com/ |
| GSTS And Open Ocean Robotics Unveil NextGen Autonomous Maritime Security System | Ocean News and Technology | industry_news | n/a | https://oceannews.com/news/defense/gsts-and-open-ocean-robotics-unveil-nextgen-autonomous-maritime-security-system/ |

## Promotion Command

After reviewing and accepting the checklist, promote with:

```bash
pnpm ingest:promote data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name"
```

Preview the promotion without writing seed files:

```bash
pnpm ingest:promote data/ingestion/candidate-batches/arctic-domain-awareness-pilot.json --reviewer "Reviewer Name" --dry-run
```
