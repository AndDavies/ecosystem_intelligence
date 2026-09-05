/** Public capabilities of this application build; publication also checks the database. */
export const dailySignalsRuntimeContract = {
  schemaVersion: "daily_signals_runtime_v3",
  newPacketVersion: "daily_signals_packet_v3",
  historicalPacketVersions: ["daily_signals_packet_v1", "daily_signals_packet_v2"],
  finalizationFunction: "finalize_signal_edition",
  evidenceSnapshots: true,
  optionalHero: true,
  independentSocialPackaging: true
} as const;
