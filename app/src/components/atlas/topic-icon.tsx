import { Anchor, BrainCircuit, Cpu, Factory, Radar, Radio, Satellite, ShieldCheck, Snowflake, Waves, Wrench } from "lucide-react";

const topics = [
  [/underwater|undersea|subsea/i, Waves],
  [/edge data|computing|processing/i, Cpu],
  [/autonomous|patrol|monitoring/i, Radar],
  [/\bAI\b|artificial|intelligence|SIGINT/i, BrainCircuit],
  [/cyber|security|threat/i, ShieldCheck],
  [/arctic|northern/i, Snowflake],
  [/build|production|industrial|procurement/i, Factory],
  [/space|satellite/i, Satellite],
  [/naval|maritime|sea\b/i, Anchor],
  [/communication|network/i, Radio],
  [/sustain|maintenance|support/i, Wrench],
] as const;

/** Decorative topic cue, shared by mission and defence-need discovery cards. */
export function TopicIcon({ title }: { title: string }) {
  const Icon = topics.find(([pattern]) => pattern.test(title))?.[1] ?? Radar;
  return <span className="atlas-topic-icon" aria-hidden="true"><Icon className="size-6" /></span>;
}
