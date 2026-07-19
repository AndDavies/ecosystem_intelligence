-- Public Atlas seed
--
-- This seed intentionally contains only the six source-validated pilot
-- organizations and the public NATO demand source. Legacy scaffold records live
-- under supabase/legacy/ and are never loaded into the public atlas schema.

insert into public.sources (
  id, title, canonical_url, publisher, source_type, visibility,
  published_at, public_approved, notes
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'KATFISH Towed SAS',
    'https://www.krakenrobotics.com/products/katfish',
    'Kraken Robotics',
    'company_website',
    'public',
    null,
    true,
    'Canonical product page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'Kraken Robotics Announces Orders For Synthetic Aperture Sonar And Subsea Batteries',
    'https://www.krakenrobotics.com/news-releases/kraken-robotics-announces-12-million-in-orders-for-synthetic-aperture-sonar-and-subsea-batteries/',
    'Kraken Robotics',
    'company_news',
    'public',
    '2025-12-02T00:00:00Z',
    true,
    'Official company release used for the reviewed organization description.'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'MDA CHORUS',
    'https://mda.space/chorus/',
    'MDA Space',
    'company_website',
    'public',
    null,
    true,
    'Canonical product page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'Government Of Canada Extends MDA Space Contract Providing Continuous Space-Based Maritime Awareness And Security',
    'https://www.prnewswire.com/news-releases/government-of-canada-extends-mda-space-contract-providing-continuous-space-based-maritime-awareness-and-security-302493532.html',
    'PR Newswire',
    'industry_news',
    'public',
    null,
    true,
    'Public contract reporting retained as secondary corroboration.'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    'Envoy AUV',
    'https://cellula.com/envoy-auv/',
    'Cellula Robotics',
    'company_website',
    'public',
    null,
    true,
    'Canonical product page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    'IRIS Terminal',
    'https://www.kongsberggeospatial.com/products/iris-terminal',
    'Kongsberg Geospatial',
    'company_website',
    'public',
    null,
    true,
    'Canonical product page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    'TRAPS Towed Reelable Active Passive Sonar',
    'https://geospectrum.ca/catalog/defence/surface-systems/traps-towed-reelable-active-passive-sonar/',
    'GeoSpectrum Technologies',
    'company_website',
    'public',
    null,
    true,
    'Canonical product page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    'Open Ocean Robotics',
    'https://www.openoceanrobotics.com/',
    'Open Ocean Robotics',
    'company_website',
    'public',
    null,
    true,
    'Canonical company page used for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    'GSTS And Open Ocean Robotics Unveil NextGen Autonomous Maritime Security System',
    'https://oceannews.com/news/defense/gsts-and-open-ocean-robotics-unveil-nextgen-autonomous-maritime-security-system/',
    'Ocean News and Technology',
    'industry_news',
    'public',
    null,
    true,
    'Secondary corroboration retained for the reviewed pilot record.'
  ),
  (
    '40000000-0000-4000-8000-000000000010',
    'NATO Aggregated Demand Signal to Industry and Innovation Ecosystems Across the Alliance',
    'https://www.nato.int/en/work-with-us/business-and-project-opportunities/demand-signal',
    'NATO',
    'government_policy',
    'public',
    '2026-07-01T00:00:00Z',
    true,
    'Canonical NATO public page. The local source PDF remains private research material.'
  );

insert into public.organizations (
  id, slug, name, description, website_url, entity_kind, organization_categories,
  publication_status, source_confidence, freshness_status,
  last_reviewed_at, published_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'kraken-robotics',
    'Kraken Robotics',
    'Canadian subsea technology company with synthetic aperture sonar, underwater imaging, subsea power, and robotic systems relevant to underwater awareness and autonomous maritime operations.',
    'https://www.krakenrobotics.com/',
    'company',
    array['commercial_company', 'defence_supplier', 'dual_use'],
    'published', 'high', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'mda-space',
    'MDA Space',
    'Canadian space and mission systems company with Earth observation, radar, space robotics, satellite operations, and maritime awareness capabilities.',
    'https://mda.space/',
    'company',
    array['commercial_company', 'space_company', 'dual_use'],
    'published', 'high', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'cellula-robotics',
    'Cellula Robotics',
    'Canadian underwater robotics company developing long-endurance autonomous underwater vehicles and related subsea autonomy systems.',
    'https://cellula.com/',
    'company',
    array['commercial_company', 'autonomous_systems', 'dual_use'],
    'published', 'moderate', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'kongsberg-geospatial',
    'Kongsberg Geospatial',
    'Ottawa-based geospatial software company providing airspace visualization, uncrewed systems awareness, and mission display software for complex operations.',
    'https://www.kongsberggeospatial.com/',
    'company',
    array['commercial_company', 'software_company', 'dual_use'],
    'published', 'high', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'geospectrum-technologies',
    'GeoSpectrum Technologies',
    'Nova Scotia underwater acoustics company offering sonar, acoustic sensors, and defence surveillance systems for surface and subsea applications.',
    'https://geospectrum.ca/',
    'company',
    array['commercial_company', 'defence_supplier', 'dual_use'],
    'published', 'high', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'open-ocean-robotics',
    'Open Ocean Robotics',
    'Canadian marine robotics company developing autonomous uncrewed surface vehicles and maritime data services for persistent ocean monitoring.',
    'https://www.openoceanrobotics.com/',
    'company',
    array['commercial_company', 'autonomous_systems', 'dual_use'],
    'published', 'moderate', 'current',
    '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  );

insert into public.locations (
  id, name, city, province_territory, country_code, latitude, longitude,
  geographic_confidence
)
values
  ('30000000-0000-4000-8000-000000000001', 'St. John''s, Newfoundland and Labrador', 'St. John''s', 'Newfoundland and Labrador', 'CA', 47.5615, -52.7126, 'city_centroid'),
  ('30000000-0000-4000-8000-000000000002', 'Brampton, Ontario', 'Brampton', 'Ontario', 'CA', 43.7315, -79.7624, 'city_centroid'),
  ('30000000-0000-4000-8000-000000000003', 'Burnaby, British Columbia', 'Burnaby', 'British Columbia', 'CA', 49.2488, -122.9805, 'city_centroid'),
  ('30000000-0000-4000-8000-000000000004', 'Ottawa, Ontario', 'Ottawa', 'Ontario', 'CA', 45.4215, -75.6972, 'city_centroid'),
  ('30000000-0000-4000-8000-000000000005', 'Dartmouth, Nova Scotia', 'Dartmouth', 'Nova Scotia', 'CA', 44.6661, -63.5728, 'city_centroid'),
  ('30000000-0000-4000-8000-000000000006', 'Victoria, British Columbia', 'Victoria', 'British Columbia', 'CA', 48.4284, -123.3656, 'city_centroid');

insert into public.organization_locations (
  organization_id, location_id, location_role, is_primary, publication_status
)
values
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'headquarters', true, 'published'),
  ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'headquarters', true, 'published'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'headquarters', true, 'published'),
  ('10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'headquarters', true, 'published'),
  ('10000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'headquarters', true, 'published'),
  ('10000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', 'headquarters', true, 'published');

insert into public.capabilities (
  id, organization_id, slug, name, summary, capability_type, core_features,
  defence_applications, novelty, technical_tags, publication_status,
  source_confidence, last_reviewed_at, published_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'kraken-katfish-sas',
    'KATFISH Towed Synthetic Aperture Sonar',
    'Actively stabilized towed synthetic aperture sonar system for high-resolution underwater survey, seabed imaging, and subsea object detection.',
    'Towed Synthetic Aperture Sonar',
    array['High-resolution underwater survey', 'Seabed imaging', 'Subsea object detection'],
    array['Underwater ISR', 'Route survey', 'Subsea infrastructure awareness'],
    array[]::text[],
    array['hardware', 'underwater_sensing', 'synthetic_aperture_sonar', 'maritime'],
    'published', 'high', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'mda-chorus-sar',
    'MDA CHORUS Synthetic Aperture Radar Constellation',
    'Next-generation C-band and X-band synthetic aperture radar constellation intended to provide all-weather day-night Earth observation data.',
    'Earth Observation SAR Constellation',
    array['C-band synthetic aperture radar', 'X-band synthetic aperture radar', 'All-weather Earth observation'],
    array['Arctic domain awareness', 'Maritime monitoring', 'Distributed sensor fusion'],
    array[]::text[],
    array['space', 'earth_observation', 'synthetic_aperture_radar', 'maritime'],
    'published', 'high', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'cellula-envoy-auv',
    'Envoy Long-Endurance Autonomous Underwater Vehicle',
    'Long-endurance fuel-cell autonomous underwater vehicle designed for persistent subsea missions and extended underwater operation.',
    'Autonomous Underwater Vehicle',
    array['Fuel-cell propulsion', 'Long-endurance subsea operation', 'Autonomous underwater vehicle'],
    array['Undersea route reconnaissance', 'Subsea infrastructure monitoring', 'Extended underwater patrol validation'],
    array[]::text[],
    array['hardware', 'autonomous_systems', 'auv', 'undersea'],
    'published', 'moderate', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'kongsberg-iris-terminal',
    'IRIS Terminal Airspace Visualization',
    'Airspace visualization and situational awareness software that combines sensor, telemetry, and air traffic inputs for uncrewed operations.',
    'Mission Visualization Software',
    array['Sensor and telemetry fusion', 'Airspace visualization', 'Uncrewed operations awareness'],
    array['Uncrewed system deconfliction', 'BVLOS test-range visualization', 'Local mission visualization'],
    array[]::text[],
    array['software', 'geospatial', 'mission_visualization', 'uncrewed_systems'],
    'published', 'high', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    'geospectrum-traps-sonar',
    'TRAPS Towed Reelable Active Passive Sonar',
    'Compact active-passive variable-depth sonar system for underwater target detection, classification, tracking, and localization.',
    'Active Passive Towed Sonar',
    array['Active-passive sonar', 'Variable-depth operation', 'Underwater target localization'],
    array['Underwater surveillance', 'Target detection and tracking', 'Surface and uncrewed platform integration'],
    array[]::text[],
    array['hardware', 'sonar', 'underwater_acoustics', 'maritime'],
    'published', 'high', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000006',
    'open-ocean-robotics-usv-maritime-awareness',
    'Autonomous USV Maritime Awareness Platform',
    'Autonomous uncrewed surface vessel platform for persistent maritime security, ocean data collection, and remote maritime awareness.',
    'Autonomous Surface Vehicle',
    array['Autonomous surface operation', 'Persistent ocean monitoring', 'Remote maritime data collection'],
    array['Persistent maritime awareness', 'Ocean data collection', 'Surface collection for distributed awareness'],
    array[]::text[],
    array['hardware', 'autonomous_systems', 'usv', 'maritime'],
    'published', 'moderate', '2026-04-24T00:00:00Z', '2026-04-24T00:00:00Z'
  );

insert into public.technical_domains (
  id, slug, name, summary, publication_status
)
values
  ('80000000-0000-4000-8000-000000000001', 'sensing-and-isr', 'Sensing and ISR', 'Sensors and collection systems that contribute to detection, characterization, and situational awareness.', 'published'),
  ('80000000-0000-4000-8000-000000000002', 'autonomous-systems', 'Autonomous Systems', 'Uncrewed and autonomous platforms for persistent operation in maritime, undersea, air, or land environments.', 'published'),
  ('80000000-0000-4000-8000-000000000003', 'mission-software-and-data', 'Mission Software and Data', 'Software for mission visualization, geospatial awareness, sensor integration, and operator decision support.', 'published'),
  ('80000000-0000-4000-8000-000000000004', 'space-and-earth-observation', 'Space and Earth Observation', 'Space systems and Earth-observation services that provide persistent, wide-area context.', 'published');

insert into public.capability_domains (
  capability_id, technical_domain_id, is_primary, publication_status
)
values
  ('20000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', true, 'published'),
  ('20000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000004', true, 'published'),
  ('20000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', false, 'published'),
  ('20000000-0000-4000-8000-000000000003', '80000000-0000-4000-8000-000000000002', true, 'published'),
  ('20000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000003', true, 'published'),
  ('20000000-0000-4000-8000-000000000005', '80000000-0000-4000-8000-000000000001', true, 'published'),
  ('20000000-0000-4000-8000-000000000006', '80000000-0000-4000-8000-000000000002', true, 'published'),
  ('20000000-0000-4000-8000-000000000006', '80000000-0000-4000-8000-000000000001', false, 'published');

insert into public.mission_areas (
  id, slug, name, summary, source_confidence, publication_status
)
values
  ('81000000-0000-4000-8000-000000000001', 'arctic-domain-awareness', 'Arctic Domain Awareness', 'Persistent sensing, monitoring, and data integration for awareness across Canada''s northern and maritime approaches.', 'moderate', 'published'),
  ('81000000-0000-4000-8000-000000000002', 'underwater-isr', 'Underwater ISR', 'Detection, survey, characterization, and persistent awareness for undersea environments and infrastructure.', 'moderate', 'published'),
  ('81000000-0000-4000-8000-000000000003', 'autonomous-patrol-and-monitoring', 'Autonomous Patrol and Monitoring', 'Uncrewed systems and operator tools that extend persistent monitoring with reduced personnel exposure.', 'moderate', 'published'),
  ('81000000-0000-4000-8000-000000000004', 'edge-data-processing', 'Edge Data Processing', 'Local processing, visualization, and integration that supports decisions when bandwidth or connectivity is constrained.', 'moderate', 'published');

insert into public.capability_mission_matches (
  id, capability_id, mission_area_id, alignment_summary, match_type,
  confidence, review_status, publication_status
)
values
  ('82000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000002', 'High-resolution towed synthetic aperture sonar can support undersea survey and seabed characterization where persistent underwater awareness is required.', 'derived', 'high', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'The capability may contribute to northern maritime awareness when undersea survey and detection gaps are relevant; Arctic operating assumptions still require validation.', 'derived', 'moderate', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 'All-weather synthetic aperture radar can provide persistent overhead context where weather and distance limit other collection methods.', 'derived', 'high', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000002', 'A long-endurance autonomous underwater vehicle can extend survey and patrol reach, subject to validation of payloads, recovery concepts, and operating conditions.', 'derived', 'moderate', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '81000000-0000-4000-8000-000000000003', 'Sensor, telemetry, and airspace visualization can support deconfliction and situational awareness for uncrewed patrol trials.', 'derived', 'high', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000004', '81000000-0000-4000-8000-000000000004', 'A common local visualization layer can reduce operator burden when telemetry, sensor, and airspace context would otherwise be separated.', 'derived', 'moderate', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000005', '81000000-0000-4000-8000-000000000002', 'Compact active-passive sonar can add underwater target detection and tracking to surface or uncrewed platforms.', 'derived', 'high', 'approved', 'published'),
  ('82000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000006', '81000000-0000-4000-8000-000000000001', 'Persistent uncrewed surface collection may extend maritime awareness in sparse regions; Arctic-specific reliability and payload integration require validation.', 'derived', 'moderate', 'approved', 'published');

insert into public.ecosystem_clusters (
  id, slug, name, summary, region_slug, cluster_basis, publication_status
)
values
  ('83000000-0000-4000-8000-000000000001', 'atlantic-ocean-sensing-and-autonomy', 'Ocean Sensing and Autonomy', 'An editorial cluster of published Atlantic Canadian organizations working in ocean sensing, sonar, and autonomous maritime systems.', 'atlantic-canada', 'editorial', 'published'),
  ('83000000-0000-4000-8000-000000000002', 'ontario-space-and-mission-systems', 'Space and Mission Systems', 'An editorial cluster of published Ontario organizations contributing space-based awareness and mission visualization.', 'ontario', 'editorial', 'published'),
  ('83000000-0000-4000-8000-000000000003', 'british-columbia-marine-autonomy', 'Marine Autonomy', 'An editorial cluster of published British Columbia organizations developing autonomous maritime and undersea platforms.', 'british-columbia', 'editorial', 'published');

insert into public.capability_clusters (
  capability_id, ecosystem_cluster_id, publication_status
)
values
  ('20000000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000001', 'published'),
  ('20000000-0000-4000-8000-000000000005', '83000000-0000-4000-8000-000000000001', 'published'),
  ('20000000-0000-4000-8000-000000000002', '83000000-0000-4000-8000-000000000002', 'published'),
  ('20000000-0000-4000-8000-000000000004', '83000000-0000-4000-8000-000000000002', 'published'),
  ('20000000-0000-4000-8000-000000000003', '83000000-0000-4000-8000-000000000003', 'published'),
  ('20000000-0000-4000-8000-000000000006', '83000000-0000-4000-8000-000000000003', 'published');

insert into public.evidence_snippets (
  id, source_id, excerpt, source_locator, visibility, public_approved
)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'Kraken describes a Canadian subsea intelligence portfolio spanning sonar, underwater imaging, subsea power, and robotic systems.', 'Company description', 'public', true),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'The KATFISH page describes an actively stabilized towed synthetic aperture sonar system for high-resolution underwater data collection.', 'Product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'MDA presents Earth observation and radar satellite capability as part of its space mission systems portfolio.', 'Company and product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 'The CHORUS page describes a next-generation Earth observation constellation using C-band and X-band synthetic aperture radar.', 'Product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 'Cellula presents underwater robotic vehicle capability through its Envoy autonomous underwater vehicle product page.', 'Company overview', 'public', true),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000005', 'The Envoy page describes a fuel-cell-powered underwater vehicle designed for long-endurance subsea operation.', 'Product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000006', 'Kongsberg Geospatial positions IRIS Terminal around airspace visualization and support for uncrewed systems operations.', 'Company overview', 'public', true),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000006', 'IRIS Terminal is described as software combining sensor, feed, and telemetry inputs for professional drone and airspace managers.', 'Product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000007', 'GeoSpectrum presents underwater acoustic and sonar products for defence and surveillance surface-system applications.', 'Company overview', 'public', true),
  ('50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000007', 'TRAPS is described as an active-passive sonar system for detection, classification, tracking, and localization of underwater targets.', 'Product overview', 'public', true),
  ('50000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000008', 'Open Ocean Robotics describes autonomous uncrewed surface vessels for maritime security and ocean data collection.', 'Company overview', 'public', true),
  ('50000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000008', 'The company frames its uncrewed vessels as persistent autonomous platforms for ocean monitoring and maritime awareness.', 'Platform overview', 'public', true),
  ('50000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000010', 'Enhancing the combat effectiveness of large land formations', 'Public summary - priority area 1', 'public', true),
  ('50000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000010', 'Defending against air and missile attacks', 'Public summary - priority area 2', 'public', true),
  ('50000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000010', 'Delivering effective deep strikes', 'Public summary - priority area 3', 'public', true),
  ('50000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000010', 'Providing rapid and scalable medical treatment and evacuation', 'Public summary - priority area 4', 'public', true),
  ('50000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000010', 'Efficient, reliable and adaptable logistics to sustain military operations', 'Public summary - priority area 5', 'public', true);

insert into public.demand_sources (
  id, source_id, slug, title, publisher, published_on,
  classification_label, source_visibility, summary, publication_status
)
values (
  '70000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000010',
  'nato-aggregated-demand-signal-2026',
  'NATO Aggregated Demand Signal to Industry and Innovation Ecosystems Across the Alliance',
  'NATO',
  '2026-07-01',
  'NATO UNCLASSIFIED',
  'public',
  'A public, problem-led signal intended to inform industry and innovation ecosystems. It is not a procurement notice and does not establish eligibility or endorsement.',
  'published'
);

insert into public.demand_source_issuers (
  demand_source_id,
  demand_issuer_id,
  issuer_role,
  publication_status
)
select
  '70000000-0000-4000-8000-000000000001',
  issuer.id,
  'issuer',
  'published'
from public.demand_issuers issuer
where issuer.slug = 'nato'
on conflict (demand_source_id, demand_issuer_id, issuer_role) do update
set publication_status = excluded.publication_status;

insert into public.demand_requirements (
  id, demand_source_id, slug, title, problem_statement, desired_end_state,
  public_caveat, display_order, publication_status
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'land-formation-combat-effectiveness',
    'Enhancing the combat effectiveness of large land formations',
    'Allied land forces need greater lethality, mobility, protection, coordination, and precision across varied terrain, climate, visibility, and contested electromagnetic conditions.',
    'Solutions should improve the speed, precision, persistence, survivability, and interoperability of land operations, including the integration of uncrewed systems.',
    'Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.',
    1,
    'published'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000001',
    'air-and-missile-defence',
    'Defending against air and missile attacks',
    'Allied forces and critical infrastructure face increasingly diverse air and missile threats that must be detected, tracked, prioritized, and engaged under all-weather, high-readiness conditions.',
    'Solutions should strengthen layered defence, resilient command and communications, real-time data exchange, mobility, magazine depth, and interoperability.',
    'Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.',
    2,
    'published'
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    '70000000-0000-4000-8000-000000000001',
    'deep-strike',
    'Delivering effective deep strikes',
    'Heavily defended and dispersed high-value targets at extended range create precision, coordination, and survivability challenges in denied or degraded environments.',
    'Solutions should support precise, rapid, and accurate effects at varying ranges while minimizing unintended impacts and maintaining interoperability.',
    'Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.',
    3,
    'published'
  ),
  (
    '71000000-0000-4000-8000-000000000004',
    '70000000-0000-4000-8000-000000000001',
    'medical-treatment-and-evacuation',
    'Providing rapid and scalable medical treatment and evacuation',
    'Allied forces need a connected medical architecture for casualty collection, patient flow, treatment, and protected evacuation across terrain, extreme weather, contested, and CBRN-affected environments.',
    'Solutions should improve deployable, modular, scalable, adaptable, and interoperable evacuation, trauma care, intensive care, diagnostics, and CBRN treatment.',
    'Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.',
    4,
    'published'
  ),
  (
    '71000000-0000-4000-8000-000000000005',
    '70000000-0000-4000-8000-000000000001',
    'logistics-and-sustainment',
    'Efficient, reliable and adaptable logistics to sustain military operations',
    'Military operations require resilient logistics networks that can preserve resupply, mobility, readiness, and multinational interoperability when infrastructure and supply chains are contested or degraded.',
    'Solutions should improve cost-effectiveness, delivery in austere and extreme-weather conditions, mobility, durability, scalability, and interoperability.',
    'Public-source alignment only. This is not procurement eligibility, NATO endorsement, or a classified requirement.',
    5,
    'published'
  );

insert into public.field_citations (
  id, entity_type, entity_id, field_name, evidence_snippet_id
)
values
  ('60000000-0000-4000-8000-000000000001', 'organization', '10000000-0000-4000-8000-000000000001', 'description', '50000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', 'capability', '20000000-0000-4000-8000-000000000001', 'summary', '50000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000003', 'organization', '10000000-0000-4000-8000-000000000002', 'description', '50000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000004', 'capability', '20000000-0000-4000-8000-000000000002', 'summary', '50000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000005', 'organization', '10000000-0000-4000-8000-000000000003', 'description', '50000000-0000-4000-8000-000000000005'),
  ('60000000-0000-4000-8000-000000000006', 'capability', '20000000-0000-4000-8000-000000000003', 'summary', '50000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000007', 'organization', '10000000-0000-4000-8000-000000000004', 'description', '50000000-0000-4000-8000-000000000007'),
  ('60000000-0000-4000-8000-000000000008', 'capability', '20000000-0000-4000-8000-000000000004', 'summary', '50000000-0000-4000-8000-000000000008'),
  ('60000000-0000-4000-8000-000000000009', 'organization', '10000000-0000-4000-8000-000000000005', 'description', '50000000-0000-4000-8000-000000000009'),
  ('60000000-0000-4000-8000-000000000010', 'capability', '20000000-0000-4000-8000-000000000005', 'summary', '50000000-0000-4000-8000-000000000010'),
  ('60000000-0000-4000-8000-000000000011', 'organization', '10000000-0000-4000-8000-000000000006', 'description', '50000000-0000-4000-8000-000000000011'),
  ('60000000-0000-4000-8000-000000000012', 'capability', '20000000-0000-4000-8000-000000000006', 'summary', '50000000-0000-4000-8000-000000000012'),
  ('60000000-0000-4000-8000-000000000013', 'demand_requirement', '71000000-0000-4000-8000-000000000001', 'title', '50000000-0000-4000-8000-000000000013'),
  ('60000000-0000-4000-8000-000000000014', 'demand_requirement', '71000000-0000-4000-8000-000000000002', 'title', '50000000-0000-4000-8000-000000000014'),
  ('60000000-0000-4000-8000-000000000015', 'demand_requirement', '71000000-0000-4000-8000-000000000003', 'title', '50000000-0000-4000-8000-000000000015'),
  ('60000000-0000-4000-8000-000000000016', 'demand_requirement', '71000000-0000-4000-8000-000000000004', 'title', '50000000-0000-4000-8000-000000000016'),
  ('60000000-0000-4000-8000-000000000017', 'demand_requirement', '71000000-0000-4000-8000-000000000005', 'title', '50000000-0000-4000-8000-000000000017'),
  ('60000000-0000-4000-8000-000000000018', 'capability_mission_match', '82000000-0000-4000-8000-000000000001', 'alignment_summary', '50000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000019', 'capability_mission_match', '82000000-0000-4000-8000-000000000002', 'alignment_summary', '50000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000020', 'capability_mission_match', '82000000-0000-4000-8000-000000000003', 'alignment_summary', '50000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000021', 'capability_mission_match', '82000000-0000-4000-8000-000000000004', 'alignment_summary', '50000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000022', 'capability_mission_match', '82000000-0000-4000-8000-000000000005', 'alignment_summary', '50000000-0000-4000-8000-000000000008'),
  ('60000000-0000-4000-8000-000000000023', 'capability_mission_match', '82000000-0000-4000-8000-000000000006', 'alignment_summary', '50000000-0000-4000-8000-000000000008'),
  ('60000000-0000-4000-8000-000000000024', 'capability_mission_match', '82000000-0000-4000-8000-000000000007', 'alignment_summary', '50000000-0000-4000-8000-000000000010'),
  ('60000000-0000-4000-8000-000000000025', 'capability_mission_match', '82000000-0000-4000-8000-000000000008', 'alignment_summary', '50000000-0000-4000-8000-000000000012');
