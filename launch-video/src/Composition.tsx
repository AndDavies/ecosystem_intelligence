import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  background: "#efefef",
  ink: "#061214",
  oceanDark: "#05161b",
  charcoal: "#1d1d1d",
  white: "#ffffff",
  card: "rgba(255, 255, 255, 0.94)",
  cardMuted: "rgba(249, 249, 249, 0.92)",
  primary: "#124a5c",
  secondary: "#2393b7",
  accent: "#77c2ec",
  danger: "#b94b3f",
  indigo: "#2d3360",
  grey: "#707070",
  muted: "#58686e",
  line: "rgba(0, 0, 0, 0.14)",
  lineStrong: "rgba(0, 0, 0, 0.28)",
};

const SCREENSHOTS = {
  dashboard: "screenshots/dashboard.png",
  briefing: "screenshots/use-case-briefing.png",
  useCase: "screenshots/use-case.png",
  domain: "screenshots/domain.png",
  capability: "screenshots/capability.png",
  company: "screenshots/company.png",
  review: "screenshots/review.png",
  shortlists: "screenshots/shortlists.png",
};

const seconds = (value: number) => Math.round(value * 30);

const SCENES = [
  { from: seconds(0), duration: seconds(6), component: MissionOpening },
  { from: seconds(6), duration: seconds(9), component: ProblemScene },
  { from: seconds(15), duration: seconds(9), component: WhyItMattersScene },
  { from: seconds(24), duration: seconds(8), component: ProductRevealScene },
  { from: seconds(32), duration: seconds(11), component: DiscoveryModesScene },
  { from: seconds(43), duration: seconds(11), component: TargetingScene },
  { from: seconds(54), duration: seconds(11), component: EvidenceScene },
  { from: seconds(65), duration: seconds(10), component: TrustDisciplineScene },
  { from: seconds(75), duration: seconds(9), component: OutcomeScene },
  { from: seconds(84), duration: seconds(6), component: CtaScene },
];

export const LaunchVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, fontFamily: fontUi }}>
      {SCENES.map((scene) => {
        const Scene = scene.component;
        return (
          <Sequence key={scene.from} from={scene.from} durationInFrames={scene.duration} premountFor={30}>
            <Scene duration={scene.duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

type SceneProps = {
  duration: number;
};

function MissionOpening({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 1.5 * fps], [28, 0], clamp);
  const titleOpacity = fade(frame, 0, 1.1 * fps);
  const mapOpacity = fade(frame, 0.2 * fps, 1.8 * fps);

  return (
    <SceneShell duration={duration} variant="dark">
      <NetworkMap opacity={mapOpacity} />
      <div style={{ ...safeArea, alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ width: 1180, transform: `translateY(${titleY}px)`, opacity: titleOpacity }}>
          <Kicker>Canada dual-use ecosystem intelligence</Kicker>
          <h1 style={heroTitle}>Build capability. Build industry.</h1>
          <p style={heroCopy}>
            A serious discovery workspace for teams helping strengthen Canada&apos;s sovereign industrial base.
          </p>
        </div>
      </div>
      <FooterCaption>Mission-led, evidence-backed business development intelligence.</FooterCaption>
    </SceneShell>
  );
}

function ProblemScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  const blocks = [
    "Stale market maps",
    "Scattered public signals",
    "Unclear capability fit",
    "Weak evidence trails",
  ];

  return (
    <SceneShell duration={duration}>
      <TwoColumn
        eyebrow="The problem"
        title="BD teams are asked to move fast through incomplete ecosystems."
        body="The work is mission-critical, but the inputs are often fragmented: spreadsheets, one-off research, company pages, policy priorities, and unconnected signals."
      >
        <div style={stackPanel}>
          {blocks.map((label, index) => (
            <DataFragment key={label} label={label} index={index} frame={frame} />
          ))}
        </div>
      </TwoColumn>
      <FooterCaption tone="light">Too many signals. Too little trust.</FooterCaption>
    </SceneShell>
  );
}

function WhyItMattersScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  const nodes = [
    ["Mission need", COLORS.primary],
    ["Domain landscape", COLORS.secondary],
    ["Capability fit", COLORS.accent],
    ["Company target", COLORS.indigo],
    ["Visible evidence", COLORS.ink],
  ];

  return (
    <SceneShell duration={duration}>
      <div style={{ ...safeArea, justifyContent: "center" }}>
        <Kicker>Why it matters</Kicker>
        <h2 style={sceneTitle}>The question is not just who is interesting.</h2>
        <p style={{ ...sceneBody, maxWidth: 1060 }}>
          It is who can help Canada bring fresh, innovative technology into real capability conversations, and why the team should believe the read.
        </p>
        <div style={flowRow}>
          {nodes.map(([label, color], index) => (
            <FlowNode key={label} color={color} label={label} index={index} frame={frame} />
          ))}
        </div>
      </div>
      <FooterCaption tone="light">Who matters? Why now? Based on what evidence?</FooterCaption>
    </SceneShell>
  );
}

function ProductRevealScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={duration} variant="dark">
      <ScreenshotFrame
        src={SCREENSHOTS.dashboard}
        frame={frame}
        x={650}
        y={120}
        width={1120}
        label="BD intelligence workspace"
      />
      <div style={{ ...safeArea, alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ width: 690 }}>
          <Kicker>Product reveal</Kicker>
          <h2 style={{ ...sceneTitle, color: COLORS.white }}>Ecosystem Intelligence</h2>
          <p style={{ ...sceneBody, color: "rgba(255,255,255,0.78)" }}>
            A capability-first discovery workspace for business development teams.
          </p>
        </div>
      </div>
      <FooterCaption>Start with the capability context, then move toward engagement.</FooterCaption>
    </SceneShell>
  );
}

function DiscoveryModesScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={duration}>
      <div style={{ ...safeArea, gap: 34 }}>
        <div>
          <Kicker>What you can do</Kicker>
          <h2 style={sceneTitle}>Move between mission-led, domain-led, and company-led discovery.</h2>
        </div>
        <div style={screenGrid}>
          <MiniScreen src={SCREENSHOTS.briefing} frame={frame} delay={0} title="Mission-led" />
          <MiniScreen src={SCREENSHOTS.domain} frame={frame} delay={10} title="Domain-led" />
          <MiniScreen src={SCREENSHOTS.company} frame={frame} delay={20} title="Company-led" />
        </div>
      </div>
      <FooterCaption tone="light">Change the entry point without losing the decision context.</FooterCaption>
    </SceneShell>
  );
}

function TargetingScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={duration} variant="dark">
      <ScreenshotFrame
        src={SCREENSHOTS.briefing}
        frame={frame}
        x={110}
        y={140}
        width={980}
        label="Top engagement targets"
      />
      <ScreenshotFrame
        src={SCREENSHOTS.shortlists}
        frame={frame}
        x={1115}
        y={495}
        width={600}
        delay={14}
        label="Working shortlists"
      />
      <div style={rightRail}>
        <Kicker>Target identification</Kicker>
        <h2 style={{ ...railTitle, color: COLORS.white }}>Find companies worth engaging.</h2>
        <p style={{ ...railBody, color: "rgba(255,255,255,0.74)" }}>
          Compare capabilities, current signals, rationale, and next steps before teams spend time in the market.
        </p>
      </div>
    </SceneShell>
  );
}

function EvidenceScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={duration}>
      <ScreenshotFrame
        src={SCREENSHOTS.capability}
        frame={frame}
        x={105}
        y={130}
        width={1120}
        label="Capability record"
      />
      <div style={evidenceCard}>
        <Kicker>Trust layer</Kicker>
        <h2 style={{ ...railTitle, color: COLORS.ink }}>Trace the field back to evidence.</h2>
        <EvidenceTrace frame={frame} />
      </div>
      <FooterCaption tone="light">Visible evidence. Freshness. Confidence. Review posture.</FooterCaption>
    </SceneShell>
  );
}

function TrustDisciplineScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();

  return (
    <SceneShell duration={duration} variant="dark" tactical>
      <TacticalGrid frame={frame} />
      <div style={{ ...safeArea, justifyContent: "center" }}>
        <div style={{ width: 760 }}>
          <Kicker>Disciplined intelligence</Kicker>
          <h2 style={{ ...sceneTitle, color: COLORS.white }}>Built for judgment, not automation theatre.</h2>
          <p style={{ ...sceneBody, color: "rgba(255,255,255,0.74)" }}>
            Evidence stays visible, review states stay close, and engagement decisions remain human-led.
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

function OutcomeScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={duration} variant="dark">
      <ScreenshotFrame
        src={SCREENSHOTS.review}
        frame={frame}
        x={120}
        y={114}
        width={720}
        label="Review posture"
      />
      <ScreenshotFrame
        src={SCREENSHOTS.company}
        frame={frame}
        x={980}
        y={116}
        width={760}
        delay={12}
        label="Company intelligence"
      />
      <div style={{ ...safeArea, justifyContent: "flex-end", paddingBottom: 74 }}>
        <h2 style={{ ...sceneTitle, width: 760, color: COLORS.white }}>
          From discovery to defensible engagement.
        </h2>
      </div>
      <FooterCaption>More focus, more context, and more confidence before outreach.</FooterCaption>
    </SceneShell>
  );
}

function CtaScene({ duration }: SceneProps) {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 45, 90, 150], [0.7, 1, 0.9, 1], clamp);

  return (
    <SceneShell duration={duration} variant="dark">
      <NetworkMap opacity={0.42} />
      <div style={{ ...safeArea, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ opacity: fade(frame, 0, 34), transform: `scale(${pulse})` }}>
          <div style={logoMark}>EI</div>
          <h2 style={{ ...heroTitle, fontSize: 94, marginTop: 28 }}>Ecosystem Intelligence</h2>
          <p style={{ ...heroCopy, marginLeft: "auto", marginRight: "auto" }}>
            Capability-first discovery for Canadian BD teams.
          </p>
        </div>
      </div>
      <FooterCaption>Bring the right solutions and capabilities to Canada.</FooterCaption>
    </SceneShell>
  );
}

function SceneShell({
  children,
  duration,
  variant = "light",
  tactical = false,
}: {
  children: ReactNode;
  duration: number;
  variant?: "light" | "dark";
  tactical?: boolean;
}) {
  const frame = useCurrentFrame();
  const opacity = fade(duration - frame, -12, 14);
  const background =
    variant === "dark"
      ? `linear-gradient(135deg, ${COLORS.oceanDark} 0%, ${COLORS.ink} 52%, ${COLORS.primary} 100%)`
      : `linear-gradient(180deg, rgba(5, 22, 27, 0.08) 0%, rgba(239, 239, 239, 0) 360px), linear-gradient(135deg, rgba(18, 74, 92, 0.08), rgba(239, 239, 239, 0) 540px), ${COLORS.background}`;

  return (
    <AbsoluteFill style={{ background, opacity, overflow: "hidden" }}>
      <GridOverlay variant={variant} tactical={tactical} />
      {children}
    </AbsoluteFill>
  );
}

function ScreenshotFrame({
  src,
  frame,
  x,
  y,
  width,
  label,
  delay = 0,
}: {
  src: string;
  frame: number;
  x: number;
  y: number;
  width: number;
  label: string;
  delay?: number;
}) {
  const entrance = fade(frame, delay, delay + 32);
  const lift = interpolate(frame, [delay, delay + 42], [34, 0], clamp);
  const drift = interpolate(frame, [delay + 42, delay + 240], [0, -12], clamp);
  const height = width * (950 / 1440);

  return (
    <div
      style={{
        ...screenshotShell,
        left: x,
        top: y + lift + drift,
        width,
        height: height + 46,
        opacity: entrance,
      }}
    >
      <div style={browserBar}>
        <span style={{ ...dot, background: COLORS.danger }} />
        <span style={{ ...dot, background: COLORS.accent }} />
        <span style={{ ...dot, background: COLORS.secondary }} />
        <span style={browserLabel}>{label}</span>
      </div>
      <Img src={staticFile(src)} style={{ width, height, objectFit: "cover", objectPosition: "top left" }} />
    </div>
  );
}

function MiniScreen({
  src,
  frame,
  delay,
  title,
}: {
  src: string;
  frame: number;
  delay: number;
  title: string;
}) {
  const opacity = fade(frame, delay, delay + 24);
  const y = interpolate(frame, [delay, delay + 36], [34, 0], clamp);

  return (
    <div style={{ ...miniScreen, opacity, transform: `translateY(${y}px)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: 285, objectFit: "cover", objectPosition: "top left" }} />
      <div style={miniLabel}>{title}</div>
    </div>
  );
}

function EvidenceTrace({ frame }: { frame: number }) {
  const steps = [
    ["Capability claim", "Cold-weather passive sensing fit"],
    ["Field citation", "Mapped to source-backed rationale"],
    ["Evidence snippet", "Public-source signal attached"],
    ["Freshness", "Updated Apr. 2026"],
  ];

  return (
    <div style={{ marginTop: 32, display: "grid", gap: 18 }}>
      {steps.map(([title, body], index) => {
        const opacity = fade(frame, 12 + index * 11, 34 + index * 11);
        const x = interpolate(frame, [12 + index * 11, 38 + index * 11], [24, 0], clamp);
        return (
          <div key={title} style={{ ...traceRow, opacity, transform: `translateX(${x}px)` }}>
            <div style={traceNumber}>{index + 1}</div>
            <div>
              <div style={traceTitle}>{title}</div>
              <div style={traceBody}>{body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataFragment({ label, index, frame }: { label: string; index: number; frame: number }) {
  const opacity = fade(frame, 8 + index * 9, 30 + index * 9);
  const x = interpolate(frame, [8 + index * 9, 34 + index * 9], [80, 0], clamp);
  return (
    <div style={{ ...fragmentCard, opacity, transform: `translateX(${x}px)` }}>
      <div style={fragmentLine} />
      <div style={{ fontSize: 34, fontWeight: 700, color: COLORS.ink }}>{label}</div>
    </div>
  );
}

function FlowNode({ color, label, index, frame }: { color: string; label: string; index: number; frame: number }) {
  const opacity = fade(frame, 8 + index * 8, 30 + index * 8);
  const scale = interpolate(frame, [8 + index * 8, 32 + index * 8], [0.92, 1], clamp);
  return (
    <div style={{ ...flowNode, opacity, transform: `scale(${scale})`, borderColor: `${color}66` }}>
      <div style={{ ...flowDot, background: color }} />
      <div>{label}</div>
    </div>
  );
}

function TwoColumn({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div style={{ ...safeArea, display: "grid", gridTemplateColumns: "0.92fr 1.08fr", alignItems: "center", gap: 86 }}>
      <div>
        <Kicker>{eyebrow}</Kicker>
        <h2 style={sceneTitle}>{title}</h2>
        <p style={sceneBody}>{body}</p>
      </div>
      {children}
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <div style={kicker}>{children}</div>;
}

function FooterCaption({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <div
      style={{
        ...footerCaption,
        color: tone === "dark" ? "rgba(255,255,255,0.76)" : COLORS.muted,
        borderColor: tone === "dark" ? "rgba(255,255,255,0.16)" : COLORS.line,
      }}
    >
      {children}
    </div>
  );
}

function GridOverlay({ variant, tactical = false }: { variant: "light" | "dark"; tactical?: boolean }) {
  const color = variant === "dark" ? "rgba(255,255,255,0.075)" : "rgba(5,22,27,0.055)";
  const size = tactical ? "40px 40px" : "56px 56px";
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: size,
        opacity: tactical ? 0.9 : 1,
      }}
    />
  );
}

function NetworkMap({ opacity }: { opacity: number }) {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 180], [0, 18], clamp);
  const nodes = [
    [240, 270, "Mission"],
    [510, 190, "Sensing"],
    [835, 335, "Autonomy"],
    [1120, 230, "Data"],
    [1370, 425, "Companies"],
    [990, 655, "Evidence"],
    [610, 690, "Engagement"],
  ];

  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${drift}px)` }}>
      {nodes.map(([x, y, label], index) => (
        <div key={String(label)} style={{ ...mapNode, left: Number(x), top: Number(y) }}>
          <div style={{ ...mapPulse, borderColor: index === 0 ? COLORS.secondary : COLORS.accent }} />
          <div style={mapLabel}>{label}</div>
        </div>
      ))}
      <div style={{ ...mapLine, left: 283, top: 310, width: 1120, rotate: "7deg" }} />
      <div style={{ ...mapLine, left: 560, top: 236, width: 420, rotate: "24deg" }} />
      <div style={{ ...mapLine, left: 900, top: 398, width: 400, rotate: "-18deg" }} />
      <div style={{ ...mapLine, left: 705, top: 715, width: 360, rotate: "-9deg" }} />
    </AbsoluteFill>
  );
}

function TacticalGrid({ frame }: { frame: number }) {
  const drift = interpolate(frame, [0, 300], [0, -26], clamp);
  const cards = [
    { label: "Source", value: "Policy anchor", x: 1040, y: 152, tone: COLORS.accent },
    { label: "Record", value: "Capability fit", x: 1245, y: 315, tone: COLORS.secondary },
    { label: "Review", value: "Human check", x: 1010, y: 530, tone: COLORS.white },
    { label: "Engage", value: "Shortlist target", x: 1325, y: 665, tone: COLORS.primary },
  ];

  return (
    <AbsoluteFill style={{ transform: `translateY(${drift}px)` }}>
      <div style={tacticalRadar} />
      <ScreenshotFrame
        src={SCREENSHOTS.review}
        frame={frame}
        x={880}
        y={126}
        width={500}
        delay={-16}
        label="Review queue"
      />
      <ScreenshotFrame
        src={SCREENSHOTS.capability}
        frame={frame}
        x={1195}
        y={470}
        width={500}
        delay={-6}
        label="Evidence posture"
      />
      {cards.map((card, index) => {
        const opacity = fade(frame, 16 + index * 8, 42 + index * 8);
        return (
          <div key={card.value} style={{ ...tacticalTag, left: card.x, top: card.y, opacity, borderColor: `${card.tone}88` }}>
            <div style={{ color: "rgba(255,255,255,0.58)", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
              {card.label}
            </div>
            <div style={{ marginTop: 6, color: COLORS.white, fontSize: 21, fontWeight: 700 }}>{card.value}</div>
          </div>
        );
      })}
      <div style={{ ...tacticalLine, left: 930, top: 255, width: 560, rotate: "17deg" }} />
      <div style={{ ...tacticalLine, left: 1110, top: 620, width: 420, rotate: "-21deg" }} />
    </AbsoluteFill>
  );
}

const fontUi = '"Open Sans", Arial, sans-serif';
const fontDisplay = "Montserrat, Arial, sans-serif";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.bezier(0.16, 1, 0.3, 1),
};

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const safeArea: CSSProperties = {
  position: "absolute",
  inset: 88,
  display: "flex",
  flexDirection: "column",
};

const heroTitle: CSSProperties = {
  margin: "18px 0 0",
  color: COLORS.white,
  fontFamily: fontDisplay,
  fontSize: 108,
  lineHeight: 0.95,
  fontWeight: 700,
  letterSpacing: 0,
};

const heroCopy: CSSProperties = {
  margin: "34px 0 0",
  width: 920,
  color: "rgba(255,255,255,0.76)",
  fontSize: 34,
  lineHeight: 1.35,
  fontWeight: 520,
  letterSpacing: 0,
};

const sceneTitle: CSSProperties = {
  margin: "22px 0 0",
  color: COLORS.ink,
  fontFamily: fontDisplay,
  fontSize: 68,
  lineHeight: 1.04,
  fontWeight: 700,
  letterSpacing: 0,
};

const sceneBody: CSSProperties = {
  margin: "30px 0 0",
  color: COLORS.muted,
  fontFamily: fontUi,
  fontSize: 30,
  lineHeight: 1.42,
  fontWeight: 480,
  letterSpacing: 0,
};

const railTitle: CSSProperties = {
  margin: "20px 0 0",
  fontFamily: fontDisplay,
  fontSize: 52,
  lineHeight: 1.04,
  fontWeight: 700,
  letterSpacing: 0,
};

const railBody: CSSProperties = {
  margin: "24px 0 0",
  fontFamily: fontUi,
  fontSize: 25,
  lineHeight: 1.46,
  fontWeight: 480,
  letterSpacing: 0,
};

const kicker: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  alignItems: "center",
  borderLeft: `4px solid ${COLORS.secondary}`,
  padding: "4px 0 4px 14px",
  color: COLORS.primary,
  fontFamily: fontUi,
  fontSize: 18,
  lineHeight: 1,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const footerCaption: CSSProperties = {
  position: "absolute",
  left: 88,
  right: 88,
  bottom: 42,
  borderTop: "1px solid",
  paddingTop: 18,
  fontFamily: fontUi,
  fontSize: 22,
  fontWeight: 600,
};

const stackPanel: CSSProperties = {
  display: "grid",
  gap: 22,
};

const fragmentCard: CSSProperties = {
  position: "relative",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 4,
  background: COLORS.card,
  padding: "34px 38px 34px 50px",
  boxShadow: "0 18px 48px rgba(5,22,27,0.1)",
  overflow: "hidden",
};

const fragmentLine: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 10,
  background: `linear-gradient(${COLORS.secondary}, ${COLORS.primary})`,
};

const flowRow: CSSProperties = {
  marginTop: 76,
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 18,
};

const flowNode: CSSProperties = {
  minHeight: 160,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  border: "2px solid",
  borderRadius: 4,
  padding: 24,
  background: COLORS.card,
  color: COLORS.ink,
  fontFamily: fontDisplay,
  fontSize: 25,
  lineHeight: 1.16,
  fontWeight: 700,
  boxShadow: "0 18px 48px rgba(5,22,27,0.1)",
};

const flowDot: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
};

const screenshotShell: CSSProperties = {
  position: "absolute",
  borderRadius: 4,
  overflow: "hidden",
  background: COLORS.white,
  boxShadow: "0 28px 80px rgba(5,22,27,0.2)",
  border: "1px solid rgba(255,255,255,0.3)",
};

const browserBar: CSSProperties = {
  height: 46,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 18px",
  background: COLORS.cardMuted,
  borderBottom: `1px solid ${COLORS.line}`,
};

const dot: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
};

const browserLabel: CSSProperties = {
  marginLeft: 10,
  color: COLORS.charcoal,
  fontFamily: fontUi,
  fontSize: 16,
  fontWeight: 700,
};

const screenGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 28,
};

const miniScreen: CSSProperties = {
  borderRadius: 4,
  overflow: "hidden",
  background: COLORS.white,
  boxShadow: "0 18px 48px rgba(5,22,27,0.1)",
  border: `1px solid ${COLORS.line}`,
};

const miniLabel: CSSProperties = {
  padding: "26px 28px",
  fontFamily: fontDisplay,
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 700,
  color: COLORS.ink,
  borderTop: `1px solid ${COLORS.line}`,
};

const rightRail: CSSProperties = {
  position: "absolute",
  right: 88,
  top: 128,
  width: 520,
};

const evidenceCard: CSSProperties = {
  position: "absolute",
  right: 100,
  top: 155,
  width: 560,
  borderRadius: 4,
  padding: 44,
  background: COLORS.card,
  border: `1px solid ${COLORS.line}`,
  boxShadow: "0 28px 80px rgba(5,22,27,0.16)",
};

const traceRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px 1fr",
  gap: 16,
  alignItems: "center",
  padding: "18px 0",
  borderTop: `1px solid ${COLORS.line}`,
};

const traceNumber: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: COLORS.ink,
  color: COLORS.white,
  fontSize: 18,
  fontWeight: 800,
};

const traceTitle: CSSProperties = {
  color: COLORS.ink,
  fontFamily: fontDisplay,
  fontSize: 22,
  fontWeight: 700,
};

const traceBody: CSSProperties = {
  marginTop: 5,
  color: COLORS.muted,
  fontFamily: fontUi,
  fontSize: 18,
  lineHeight: 1.35,
  fontWeight: 520,
};

const mapNode: CSSProperties = {
  position: "absolute",
  minWidth: 150,
  minHeight: 78,
};

const mapPulse: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 999,
  border: "3px solid",
  background: "rgba(255,255,255,0.11)",
  boxShadow: "0 0 80px rgba(255,255,255,0.12)",
};

const mapLabel: CSSProperties = {
  marginTop: 10,
  color: "rgba(255,255,255,0.74)",
  fontFamily: fontUi,
  fontSize: 18,
  fontWeight: 700,
};

const mapLine: CSSProperties = {
  position: "absolute",
  height: 2,
  background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.24), rgba(255,255,255,0.02))",
  transformOrigin: "left center",
};

const tacticalRadar: CSSProperties = {
  position: "absolute",
  right: 162,
  top: 104,
  width: 640,
  height: 640,
  border: "1px solid rgba(119,194,236,0.28)",
  background:
    "radial-gradient(circle, rgba(119,194,236,0.2) 0 1px, transparent 2px), radial-gradient(circle, transparent 0 36%, rgba(119,194,236,0.12) 36.2% 36.6%, transparent 37%), radial-gradient(circle, transparent 0 63%, rgba(119,194,236,0.1) 63.2% 63.6%, transparent 64%)",
  backgroundSize: "34px 34px, 100% 100%, 100% 100%",
  opacity: 0.55,
};

const tacticalTag: CSSProperties = {
  position: "absolute",
  width: 230,
  border: "1px solid",
  background: "rgba(5,22,27,0.72)",
  padding: "16px 18px",
  boxShadow: "0 18px 48px rgba(5,22,27,0.28)",
  fontFamily: fontUi,
};

const tacticalLine: CSSProperties = {
  position: "absolute",
  height: 1,
  background: "linear-gradient(90deg, transparent, rgba(119,194,236,0.46), transparent)",
  transformOrigin: "left center",
};

const logoMark: CSSProperties = {
  margin: "0 auto",
  width: 116,
  height: 116,
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.34)",
  background: "rgba(18,74,92,0.72)",
  color: COLORS.white,
  fontFamily: fontDisplay,
  fontSize: 40,
  fontWeight: 700,
};
