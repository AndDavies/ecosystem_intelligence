-- One-off public-beta editorial enrichment. Every line remains bounded by the
-- existing reviewed public evidence; the copy leads with the decision value
-- instead of reciting implementation detail.
update public.organizations as organization set
  description = copy.description,
  freshness_status = 'current',
  last_reviewed_at = now(),
  updated_at = now()
from (values
  ('f5293808-d4a2-42fb-8ed0-0dce7e136e9e'::uuid, $copy$Measure the water column without rebuilding the instrument package. AML Oceanographic makes swappable sensors, profilers, and moving-vessel systems in Canada for hydrographic and ocean operations.$copy$),
  ('67d97a8a-e9e0-404e-b29d-55c07e766573'::uuid, $copy$Turn workforce behaviour into a visible, manageable layer of cyber defence. Beauceron Security combines anti-phishing, security awareness, email analysis, and personal risk feedback from its Fredericton base.$copy$),
  ('dd2c465d-eec3-439f-838f-4c40f79073b6'::uuid, $copy$Design, build, certify, deliver, and sustain rotorcraft from one Canadian industrial base. Bell Textron Canada brings engineering, composite manufacturing, flight test, customization, and long-term fleet support together in Mirabel.$copy$),
  ('2f2bdda8-b3ce-4657-99b3-36b1dca1a607'::uuid, $copy$Give Atlantic Canadian technology founders an early-stage capital partner close to home. Build Ventures invests from Halifax and works with companies as they move from initial traction toward scale.$copy$),
  ('72462243-baf5-49bb-923e-47cf9fff6a6a'::uuid, $copy$Make better operating decisions where ice, ocean, terrain, and remoteness raise the stakes. C-CORE applies research and engineering to sensing, geotechnical, ocean, and ice challenges from Newfoundland and Labrador.$copy$),
  ('334169c4-ac7e-4fca-b97d-25c11b84abfd'::uuid, $copy$Move mission-critical hardware from design through production and sustainment in Canada. Calian combines engineering, integration, test, advanced manufacturing, and lifecycle support across defence electronics, communications, RF, space, and vehicle systems.$copy$),
  ('10000000-0000-4000-8000-000000000003'::uuid, $copy$Keep subsea missions running longer without routine recovery. Cellula Robotics develops fuel-cell autonomous underwater vehicles and related autonomy systems for persistent operations from British Columbia.$copy$),
  ('5f376a4e-3e39-4633-9b6c-c88afac8b418'::uuid, $copy$Move an ocean-technology idea closer to a customer, trial, or investment. COVE connects companies with waterfront facilities, shared equipment, programs, mentors, and marine-sector expertise in Nova Scotia.$copy$),
  ('d8d3a83b-a53c-4d9f-b357-d7ea75143d75'::uuid, $copy$Inspect hazardous underwater spaces while operators stay at a safer distance. Deep Trekker builds portable, battery-powered ROVs in Ontario for reconnaissance, security, inspection, and public-safety work.$copy$),
  ('5b110511-87af-4d6b-b8f4-ab5105b63539'::uuid, $copy$Give land forces a clearer operating picture and keep information moving across vehicles, sensors, radios, and dismounted teams. General Dynamics Mission Systems-Canada integrates tactical networks, computing, vetronics, cyber, and mission systems in Canada.$copy$),
  ('10000000-0000-4000-8000-000000000005'::uuid, $copy$Find and follow underwater targets from compact surface and subsea platforms. Nova Scotia-based GeoSpectrum Technologies builds sonar, acoustic sensors, and surveillance systems for defence and ocean operations.$copy$),
  ('65876b6e-7e7a-4b26-aabe-850296241f63'::uuid, $copy$Send autonomous systems farther into difficult underwater environments. International Submarine Engineering designs configurable AUVs and ROVs in British Columbia for scientific, commercial, and military missions.$copy$),
  ('5f0e760f-6ae7-4a1d-ba98-36c20fede2d3'::uuid, $copy$Turn underwater sound into information teams can detect, locate, model, and act on. JASCO Applied Sciences combines acoustic instruments, real-time software, arrays, and defence-focused analysis in Canada.$copy$),
  ('929abf28-47c3-4aad-968c-6b294524f38d'::uuid, $copy$Put expert guidance in front of a technician without flying the expert to the job. Kognitiv Spark builds secure hands-free remote-support tools in Fredericton for defence, marine, manufacturing, and other demanding environments.$copy$),
  ('10000000-0000-4000-8000-000000000004'::uuid, $copy$See aircraft, drones, sensors, and airspace constraints in one operational view. Ottawa-based Kongsberg Geospatial develops mission visualization and situational-awareness software for complex uncrewed operations.$copy$),
  ('10000000-0000-4000-8000-000000000001'::uuid, $copy$See the seabed and underwater objects in high resolution from a towable survey system. Kraken Robotics develops synthetic-aperture sonar, subsea imaging, power, and robotic technology from Canada.$copy$),
  ('422bf0aa-545a-4dd1-981b-ad5a841a2104'::uuid, $copy$Help a Canadian B2B technology company reach customers, partners, and investors faster. L-SPARK runs focused accelerator cohorts and corporate innovation programs built around mentorship and market access.$copy$),
  ('2ffcb30b-5975-4baa-ba42-1355f2c2970a'::uuid, $copy$Bring safety-critical aircraft software and electronics to certification with Canadian engineering support. MANNARINO covers airborne software, hardware, systems engineering, simulation, and compliance from Quebec.$copy$),
  ('10000000-0000-4000-8000-000000000002'::uuid, $copy$Observe wide areas through cloud, darkness, and difficult weather. MDA Space brings Canadian radar Earth observation together with space robotics, satellite operations, and mission systems.$copy$),
  ('115b4b5c-e0e4-45fa-9fef-31e16329be30'::uuid, $copy$Prove an engine or component before it enters service. MDS Aero Support delivers Canadian-designed test facilities, controls, instrumentation, data systems, environmental simulation, and lifecycle support for gas turbines.$copy$),
  ('d7e29ee5-b9c8-4fbc-a038-3df5b4ad1899'::uuid, $copy$Move artificial-intelligence models from the lab onto spaceflight computers with a repeatable test and deployment path. Mission Control builds mission software and robotic-flight tools in Ottawa.$copy$),
  ('32736774-b3b5-4fd1-aff8-dbcd33eaef4a'::uuid, $copy$Build the acoustic front end for naval detection and tracking in Canada. Nautel Sonar develops hull-mounted and variable-depth wet-end sonar products, subsystems, and complete systems in Nova Scotia.$copy$),
  ('f966b0a8-eac2-4496-b4dd-249655bff773'::uuid, $copy$Shorten the path from a Canadian payload to orbit. NordSpace is developing launch vehicles, liquid engines, satellites, Atlantic launch infrastructure, and high-speed research platforms.$copy$),
  ('a1caec16-2af1-469e-8ee7-8f9f718f581d'::uuid, $copy$Listen underwater, process sound at the sensor, and move the data into monitoring workflows. Ocean Sonics builds smart digital hydrophones and acoustic systems in Nova Scotia.$copy$),
  ('10000000-0000-4000-8000-000000000006'::uuid, $copy$Watch more ocean for longer without keeping a crew at sea. Open Ocean Robotics develops autonomous surface vessels and maritime data services for persistent monitoring and security.$copy$),
  ('78532d21-8dfc-470f-9526-0f98c4a57631'::uuid, $copy$Train and test against realistic air, land, and naval threats without expending operational systems. QinetiQ Target Systems Canada designs and produces targets, control systems, scoring, and launch equipment in Medicine Hat.$copy$),
  ('3aacf739-aaf4-4882-b45e-e4febfac9d42'::uuid, $copy$Understand the water conditions shaping a subsea mission. RBR designs and manufactures Canadian oceanographic sensors and loggers for measurements from coastal waters to deep-ocean and polar environments.$copy$),
  ('55f3bd30-2007-432b-9927-504283bb1a86'::uuid, $copy$Put eyes and tools underwater with a durable, modular vehicle built in Canada. SEAMOR Marine manufactures inspection-class ROVs, cameras, and accessories in Nanaimo.$copy$),
  ('cae6fff8-29d7-4ee6-84da-f887f32c7c20'::uuid, $copy$Build underwater acoustic sensing around the mission instead of a fixed catalogue part. Sensor Technology manufactures custom piezoelectric transducers, hydrophones, and sensing systems in Ontario.$copy$),
  ('919d4268-fe44-4a76-b735-b2a690da5deb'::uuid, $copy$Connect teams and communities where distance, weather, and sparse infrastructure make conventional networks difficult. SSi Canada designs, builds, operates, and supports satellite, broadband, wireless, and last-mile systems from the North.$copy$),
  ('0f991970-b2e5-4bc2-bf9a-72153f2b5d07'::uuid, $copy$Keep military aircraft engines available longer and plan maintenance before failures disrupt the fleet. StandardAero provides overhaul, testing, engineering, component repair, and fleet support from Winnipeg.$copy$),
  ('aef233ee-0dcb-442b-8f29-72868af33656'::uuid, $copy$Bring clear underwater imagery into inspection, survey, and remote-operation workflows. SubC Imaging combines Canadian cameras, lights, lasers, recording software, and remote systems from Newfoundland and Labrador.$copy$),
  ('75e6c046-813c-4772-b741-9ff5b684e006'::uuid, $copy$Capture imagery detailed enough to identify, inspect, and document underwater objects. Voyis combines subsea cameras, lighting, and laser scanning for vehicle-based missions from Waterloo.$copy$),
  ('d73e371f-52bc-4b73-98e4-2302abb86b69'::uuid, $copy$See material and environmental differences that conventional imagery can miss. Edmonton-based Wyvern provides commercial hyperspectral satellite data for monitoring, analysis, and peace-and-security uses.$copy$),
  ('9daab099-87cb-4be0-b4d3-aaf3eeab4d4f'::uuid, $copy$Find valuable equipment after it returns from the deep ocean. Xeos Technologies builds Canadian beacons, telemetry products, and sensors for locating, monitoring, and recovering marine assets.$copy$)
) as copy(id, description)
where organization.id = copy.id;

update public.capabilities as capability set
  summary = copy.summary,
  last_reviewed_at = now(),
  updated_at = now()
from (values
  ('d5b04455-4d49-4c22-92eb-4a155779c90f'::uuid, $copy$Swap sensors and deployment methods without replacing the full instrument system, so teams can measure sound velocity, conductivity, temperature, depth, turbidity, and other water-column conditions with one adaptable platform.$copy$),
  ('0c606002-6abf-4d99-ab94-25c97c80c534'::uuid, $copy$Show each person where cyber risk is changing, reinforce safer behaviour with adaptive simulations, and speed up suspicious-email analysis before a small mistake becomes an incident.$copy$),
  ('1ccede19-8c44-416a-896b-4a4ea3fd0a1f'::uuid, $copy$Keep rotorcraft design, manufacturing, flight test, certification, delivery, modernization, and long-term support inside one Canadian operation.$copy$),
  ('f19a9a3b-dff4-4f2a-a80c-6a981db065c7'::uuid, $copy$Take defence electronics and integrated hardware from requirements through Canadian production, test, delivery, and lifecycle support while reducing dependence on fragile external supply chains.$copy$),
  ('20000000-0000-4000-8000-000000000003'::uuid, $copy$Use fuel-cell endurance to keep an autonomous underwater vehicle on extended subsea missions, reducing the frequency and operational cost of recovery and redeployment.$copy$),
  ('7f33e609-b23f-454f-89b2-710c5f4768ea'::uuid, $copy$Deploy a portable battery-powered ROV quickly, combine video with sonar and positioning, and inspect ports, vessels, divers, or underwater hazards while operators remain at a safer distance.$copy$),
  ('e6fbf2df-f372-4a3c-8a13-f98ba9c3fff1'::uuid, $copy$Connect radios, sensors, vehicles, aircraft, uncrewed systems, and dismounted teams so commanders receive a shared operating picture and actionable information in near real time.$copy$),
  ('20000000-0000-4000-8000-000000000005'::uuid, $copy$Lower a compact active-passive sonar to the useful depth and detect, classify, track, and localize underwater targets from surface or uncrewed platforms.$copy$),
  ('4a2c3595-091e-40bf-bf5c-b5dd85a0d753'::uuid, $copy$Configure a long-range AUV for survey or reconnaissance and send it beneath ice or across extended routes where continuous human control is not practical.$copy$),
  ('91dc8c99-5f32-4a7c-acdd-4b73219d41d4'::uuid, $copy$Combine hydrophone arrays, real-time processing, acoustic detection and localization, and sonar-performance analysis to turn complex underwater sound into operational awareness.$copy$),
  ('cadc48a8-900b-4d32-ace9-3753467d099c'::uuid, $copy$Let a frontline worker see documents and collaborate hands-free with a remote expert, helping teams diagnose and complete complex work across low-bandwidth and demanding environments.$copy$),
  ('20000000-0000-4000-8000-000000000004'::uuid, $copy$Combine telemetry, sensors, and air-traffic information in one airspace display so operators can monitor uncrewed missions and recognize conflicts sooner.$copy$),
  ('20000000-0000-4000-8000-000000000001'::uuid, $copy$Tow a stabilized synthetic-aperture sonar to produce high-resolution seabed imagery and find subsea objects across wide survey areas.$copy$),
  ('5a71dbb3-365f-4a58-b36b-70bca37ea8a3'::uuid, $copy$Design and certify airborne software, electronics, controls, and simulated systems against safety-critical requirements before they become costly aircraft-integration problems.$copy$),
  ('20000000-0000-4000-8000-000000000002'::uuid, $copy$Collect day-night, all-weather radar imagery in C- and X-band so teams can revisit, monitor, and compare activity across large or remote areas.$copy$),
  ('6f317ea6-b272-4930-9d80-abbe7663b2e3'::uuid, $copy$Build and operate a complete gas-turbine test environment with integrated controls, instrumentation, data acquisition, construction, and support from one engineering partner.$copy$),
  ('36a3e845-8137-41c6-925b-6d260f070bf5'::uuid, $copy$Build, validate, target, and deploy artificial-intelligence models to spaceflight processors through one workflow, then inspect their outputs before mission use.$copy$),
  ('78ef8700-62fe-4aea-a94f-2f993b76bf82'::uuid, $copy$Source Canadian hull-mounted and variable-depth wet-end sonar products and subsystems for naval detection, tracking, and underwater-warfare integration.$copy$),
  ('f168bf8f-6e45-43c5-9544-27887300ba0a'::uuid, $copy$Develop launch vehicles, liquid engines, satellites, launch infrastructure, and high-speed research platforms as a connected Canadian path toward responsive access to space.$copy$),
  ('f1264690-d99b-455c-a024-50119c231498'::uuid, $copy$Record, stream, and process underwater sound inside a smart digital hydrophone so acoustic data can move directly into monitoring systems or distributed arrays.$copy$),
  ('20000000-0000-4000-8000-000000000006'::uuid, $copy$Send an autonomous surface vessel on persistent ocean-monitoring missions and deliver maritime data remotely without keeping a crew continuously at sea.$copy$),
  ('82a4d84f-3fe9-4ae4-bb40-2d48d6a1ff41'::uuid, $copy$Represent evolving aerial, land, and naval threats with Canadian-produced targets, command-and-control, scoring, launchers, and remotely operated mission vehicles.$copy$),
  ('53af341d-1058-4da4-b1fc-5539d8fe4af1'::uuid, $copy$Measure temperature, depth, salinity, dissolved gases, pH, and other water properties from coastal, deep-ocean, and polar environments to understand the conditions shaping underwater operations.$copy$),
  ('5f48e6b0-6294-4cb8-9487-64b096e93d28'::uuid, $copy$Use a Canadian-built inspection ROV with integrated cameras, directional control, and modular accessories to observe infrastructure and complete underwater work.$copy$),
  ('674fb425-d157-4c56-9514-d5d86781e748'::uuid, $copy$Configure Canadian-made piezoelectric transducers, hydrophones, and acoustic assemblies around the sensing range, platform, and underwater environment the mission requires.$copy$),
  ('72642081-41a3-4fe6-b178-0517d1b40634'::uuid, $copy$Design, deploy, operate, and support satellite, microwave, fibre, broadband, and wireless networks as one service for remote and northern environments.$copy$),
  ('290e2e3e-02e5-4a9a-bf2e-a13d4f33dd6d'::uuid, $copy$Overhaul, test, repair, model, and manage T56 and 501-D propulsion fleets to increase time on wing, reduce unplanned maintenance, and sustain aircraft readiness.$copy$),
  ('ce3fe97e-cc6e-44ce-a118-d808bdc0d81d'::uuid, $copy$Combine subsea cameras, lighting, lasers, recording software, and remote operations to capture clearer evidence during underwater inspection and survey missions.$copy$),
  ('453b38f9-d588-420b-a21d-5f510369f183'::uuid, $copy$Capture high-resolution subsea video and still imagery with integrated lighting and optional laser scanning, making underwater inspection results easier to identify, measure, and document.$copy$),
  ('a6f654b0-4120-4401-8577-f5cbb435c1c1'::uuid, $copy$Use commercial, unclassified hyperspectral satellite imagery to distinguish materials and environmental conditions, monitor sites consistently, and share findings across teams.$copy$),
  ('54ec32d3-d3ab-4912-87ba-9d924fad6b3b'::uuid, $copy$Attach an Argos recovery beacon rated to 11,000 metres so deep-ocean equipment can report its position after surfacing and be recovered faster.$copy$)
) as copy(id, summary)
where capability.id = copy.id;

update public.demand_sources set
  summary = case slug
    when 'nato-aggregated-demand-signal-2026' then $copy$See the five public problem areas NATO is asking industry and innovation teams to work against, then compare Canadian technologies without mistaking alignment for eligibility or endorsement.$copy$
    when 'canadian-army-true-north-precision-2026' then $copy$See where the Canadian Army is seeking affordable drone-based laser ranging to improve target location, indirect-fire coordination, battlefield awareness, and frontline resilience.$copy$
    else summary end,
  updated_at = now()
where slug in ('nato-aggregated-demand-signal-2026', 'canadian-army-true-north-precision-2026');

update public.demand_requirements set
  problem_statement = case slug
    when 'land-formation-combat-effectiveness' then $copy$Move and coordinate large land formations faster while improving lethality, protection, precision, and survivability across difficult terrain, poor visibility, and contested electromagnetic conditions.$copy$
    when 'air-and-missile-defence' then $copy$Detect, track, prioritize, and engage a growing mix of air and missile threats before they reach forces or critical infrastructure, including in all-weather and high-readiness conditions.$copy$
    when 'deep-strike' then $copy$Reach defended, dispersed, and time-sensitive targets at extended range while preserving precision, coordination, survivability, and control of unintended effects.$copy$
    when 'medical-treatment-and-evacuation' then $copy$Move casualties from collection through treatment and protected evacuation when terrain, weather, contested movement, or CBRN hazards strain the medical system.$copy$
    when 'logistics-and-sustainment' then $copy$Keep forces supplied, mobile, and ready when infrastructure, transport routes, and supply chains are contested, degraded, or stretched across extreme environments.$copy$
    when 'low-cost-drone-laser-ranging-for-indirect-fire' then $copy$Give frontline units affordable small drones that can locate targets accurately enough to support sensor-to-shooter workflows and indirect-fire coordination.$copy$
    else problem_statement end,
  desired_end_state = case slug
    when 'land-formation-combat-effectiveness' then $copy$Teams can find, decide, move, and act with greater speed and precision while integrating uncrewed systems and maintaining interoperability across the formation.$copy$
    when 'air-and-missile-defence' then $copy$Layered defences share reliable data in real time, remain mobile and resilient, and preserve enough capacity to respond across sustained operations.$copy$
    when 'deep-strike' then $copy$Forces can coordinate precise effects across different ranges, operate in denied or degraded environments, and reduce unintended impacts.$copy$
    when 'medical-treatment-and-evacuation' then $copy$Casualty care and evacuation can scale, move, and interoperate across the force using deployable treatment, diagnostics, intensive care, and CBRN-ready support.$copy$
    when 'logistics-and-sustainment' then $copy$Multinational forces can resupply and sustain operations cost-effectively through austere conditions with more durable, mobile, scalable, and interoperable support.$copy$
    when 'low-cost-drone-laser-ranging-for-indirect-fire' then $copy$Small-drone targeting and range finding improve battlefield awareness, speed decisions, strengthen indirect-fire integration, and reduce exposure for soldiers in harsh conditions.$copy$
    else desired_end_state end,
  updated_at = now()
where publication_status = 'published';

-- Replace machine-written match prompts with concise public interpretations
-- grounded in the reviewed capability and demand evidence. Publication remains
-- a separate reviewer action after this migration.
update public.candidate_changes as candidate set
  proposed_record = jsonb_set(
    jsonb_set(candidate.proposed_record, '{alignmentSummary}', to_jsonb(copy.alignment_summary)),
    '{rationale}', to_jsonb(copy.rationale)
  ),
  reviewer_rationale = copy.reviewer_rationale,
  updated_at = now()
from (values
  ('f706d84f-2b3e-4ebe-91f5-ff1d802f24a6'::uuid,
   $copy$Bell's Mirabel operation keeps rotorcraft design, production, certification, modernization, and long-term fleet support connected in Canada. That industrial depth can help sustain aviation mobility and readiness over long operating cycles.$copy$,
   $copy$Bell's official Canada page documents integrated design, manufacturing, flight test, certification, aftermarket support, CH-146 Griffon modernization, and an in-service support contract extending to 2039. The public logistics signal calls for durable, adaptable support that preserves mobility and readiness. The match is useful because Bell's Canadian sustainment base is a concrete example of the industrial capacity needed to keep a military aviation fleet available; it does not imply a new requirement, contract, or endorsement.$copy$,
   $copy$Publish because Bell's first-party evidence shows an established Canadian rotorcraft production and fleet-sustainment base, including CH-146 modernization and long-term support. This gives users a concrete way to connect the public need for resilient logistics and operational readiness to a Canadian aviation capability. Label it as a moderate, public-source interpretation only.$copy$),
  ('a0cdd6f3-7067-43ae-b381-94b97c4da1dd'::uuid,
   $copy$Calian can take mission-critical electronics and integrated hardware from engineering through Canadian production, test, and lifecycle support. That reduces supply-chain exposure and helps programs adapt equipment without losing continuity of support.$copy$,
   $copy$Calian's official defence manufacturing page documents engineering, integration, test, electronics and communications production, supply-chain management, customization, and lifecycle support across Canadian facilities. The public logistics signal emphasizes resilient supply, durability, adaptability, and sustained readiness. The match is decision-useful because Calian provides domestic production and support capacity across several hardware categories; it does not establish program fit or procurement eligibility.$copy$,
   $copy$Publish because Calian's first-party evidence directly supports Canadian production, integration, testing, customization, supply-chain management, and lifecycle sustainment. Those functions are materially relevant to resilient defence logistics and reduced external dependency. Keep the assessment moderate and clearly separate from any buying decision.$copy$),
  ('cd002ad8-0e0a-4c49-a9e1-f1f77779b35a'::uuid,
   $copy$General Dynamics Mission Systems-Canada connects tactical networks, radios, sensors, vehicles, aircraft, uncrewed systems, and dismounted teams into a shared operating picture. That can shorten the path from detection to decision across a large land formation.$copy$,
   $copy$The company's official land-systems page describes secure fleet-wide communications, DIGITALspine integration across radios, sensors, radars, vehicles, aircraft, UAVs, and soldiers, plus near-real-time situational awareness. The public land-formation signal seeks faster coordination, precision, interoperability, and integration of uncrewed systems in contested conditions. This is a direct capability-to-problem alignment, while remaining a public-source interpretation rather than evidence of procurement intent.$copy$,
   $copy$Publish because the first-party product evidence maps directly to the public need for connected, interoperable land formations: secure tactical networking, cross-platform sensor integration, and near-real-time shared awareness. The relationship helps a BD user see why the company belongs in a land-force landscape without implying selection or endorsement.$copy$),
  ('87b66f48-185c-4551-85b4-8ebc2abc0575'::uuid,
   $copy$RemoteSpark puts remote expertise and technical information in a frontline worker's field of view, even across constrained bandwidth. That can reduce travel, shorten repair cycles, and keep distributed equipment and teams working.$copy$,
   $copy$Kognitiv Spark's official company page describes secure hands-free collaboration, in-view documents, real-time remote expertise, and operation regardless of location, bandwidth, or conditions. The public logistics signal calls for adaptable sustainment in austere and degraded environments. The match is useful because remote technical support can preserve equipment availability and distribute scarce expertise, although the public evidence does not prove performance in a specific military program.$copy$,
   $copy$Publish because the verified product functions address a practical sustainment bottleneck: getting expert guidance and technical information to frontline workers without moving the expert. This can reduce downtime and extend scarce maintenance knowledge across remote teams. Keep the caveat that mission-specific performance still requires validation.$copy$),
  ('2037292b-504d-4dc0-8331-fc9a12653a40'::uuid,
   $copy$QinetiQ Target Systems Canada gives forces realistic air, land, and naval threats to detect, track, engage, and learn from during test and training. That can improve readiness before large formations face the same threat patterns in operations.$copy$,
   $copy$QinetiQ's official page documents Canadian-produced fixed-wing, rotary-wing, land, and remotely operated surface targets, plus command-and-control, scoring, launchers, and realistic live exercises. The public land-formation signal seeks better protection, coordination, precision, survivability, and integration of uncrewed systems. The match is useful at the readiness and validation layer: target systems help forces test responses and rehearse against evolving threats, but they are not themselves an operational combat-effect system.$copy$,
   $copy$Publish because QinetiQ's first-party evidence shows a concrete Canadian test-and-training capability for realistic threat representation, control, and scoring. It supports land-force effectiveness by helping teams validate systems and rehearse responses before operations. State clearly that the fit is to readiness and evaluation, not an operational weapon or procurement endorsement.$copy$),
  ('8cc6d3e3-faa5-4734-af75-20ca1666b7c3'::uuid,
   $copy$SSi Canada designs, builds, operates, and supports communications networks where distance and sparse infrastructure make connectivity difficult. Those networks can keep remote teams, logistics nodes, and support services connected across northern operations.$copy$,
   $copy$SSi's official custom-solutions page documents satellite, microwave, fibre, broadband, wireless last-mile systems, 24/7 network operations, logistics, maintenance coordination, and long experience in remote northern environments. The public logistics signal emphasizes resilient networks, delivery in austere and extreme-weather conditions, and sustained multinational operations. The connection is enabling rather than direct: communications can support logistics coordination, but the source does not demonstrate a specific defence logistics deployment.$copy$,
   $copy$Publish because SSi's verified remote-network design, deployment, operations, logistics, and lifecycle support are relevant enabling infrastructure for austere and northern sustainment. The match helps users identify communications dependencies behind logistics resilience. Rate it moderate and retain the caveat that no specific military deployment is asserted.$copy$),
  ('3bd311d8-2ec8-49e5-bb99-a3905642e8c9'::uuid,
   $copy$StandardAero overhauls, tests, repairs, models, and manages T56 and 501-D propulsion fleets from Winnipeg. That can increase time on wing, reduce unplanned maintenance, and keep C-130 and CP-140 aircraft available.$copy$,
   $copy$StandardAero's official T56/501-D page documents depot-level overhaul, more than 90 percent in-house repair capability, full testing, engineering, predictive maintenance, fleet management, logistics support, and service to Canadian and allied military operators. The public logistics signal seeks reliable, adaptable sustainment that preserves readiness. This is a direct public-source alignment to military aviation sustainment, without implying a new procurement opportunity.$copy$,
   $copy$Publish because StandardAero's first-party evidence directly demonstrates military propulsion overhaul, testing, engineering, predictive maintenance, and fleet support from Winnipeg, including Canadian Forces work. The capability clearly helps users understand how Canadian industrial capacity sustains aircraft readiness. It remains an alignment assessment, not a statement of future demand.$copy$)
) as copy(id, alignment_summary, rationale, reviewer_rationale)
where candidate.id = copy.id
  and candidate.candidate_kind = 'demand_match_bundle'
  and candidate.status = 'pending';
