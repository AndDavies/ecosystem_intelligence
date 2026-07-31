import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.TNM_ROOT ? path.resolve(process.env.TNM_ROOT) : path.resolve(here, "../../..");
const outputDir = process.env.TNM_OUTPUT_DIR ? path.resolve(process.env.TNM_OUTPUT_DIR) : here;
const screenshots = path.join(outputDir, "screenshots");
const brand = path.join(root, "app/public/brand");
const outputPptx = path.join(outputDir, "partner-and-media-deck.pptx");
const directRenderDir = path.join(root, "tmp/launch-kit-2026-08/artifact-tool-rendered");

const W = 1280;
const H = 720;
const INK = "#242827";
const FIELD = "#F7F7F3";
const PAPER = "#FFFFFF";
const SIGNAL = "#F5E900";
const SIGNAL_WASH = "#FFFBD2";
const QUIET = "#666965";
const RULE = "#D9DBD5";
const GREEN = "#126147";

async function readBytes(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addText(slide, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name: options.name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: options.fontSize ?? 18,
    fontFamily: options.fontFamily ?? "Arial",
    bold: options.bold ?? false,
    color: options.color ?? INK,
    alignment: options.alignment ?? "left",
    verticalAlignment: options.verticalAlignment ?? "top",
  };
  return shape;
}

function addBox(slide, position, fill, name, lineFill = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position,
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function addRule(slide, left, top, width, color = RULE, height = 2) {
  return addBox(slide, { left, top, width, height }, color, "rule");
}

async function addImage(slide, filePath, position, alt, fit = "cover") {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === ".svg" ? "image/svg+xml" : ext === ".png" ? "image/png" : "image/jpeg";
  return slide.images.add({
    blob: await readBytes(filePath),
    contentType,
    alt,
    fit,
    position,
    geometry: "rect",
  });
}

async function addLogo(slide, variant = "dark", position = { left: 72, top: 52, width: 250, height: 48 }) {
  const file = variant === "light" ? "true-north-map-horizontal-light.svg" : "true-north-map-horizontal.svg";
  return addImage(slide, path.join(brand, file), position, "True North Map", "contain");
}

function addFooter(slide, number, dark = false) {
  addRule(slide, 72, 677, 1136, dark ? "#555A57" : RULE, 1);
  addText(slide, "TRUENORTHMAP.CA", { left: 72, top: 687, width: 230, height: 18 }, {
    fontSize: 11,
    bold: true,
    color: dark ? PAPER : QUIET,
  });
  addText(slide, String(number).padStart(2, "0"), { left: 1170, top: 687, width: 38, height: 18 }, {
    fontSize: 11,
    bold: true,
    color: dark ? SIGNAL : QUIET,
    alignment: "right",
  });
}

function setNotes(slide, presenter, sources) {
  const notes = [
    presenter,
    "",
    "[Sources]",
    ...sources.map((source) => `- ${source}`),
    "[/Sources]",
  ].join("\n");
  slide.speakerNotes.textFrame.setText(notes);
}

function addEyebrow(slide, text, left = 72, top = 80, color = QUIET) {
  addText(slide, text.toUpperCase(), { left, top, width: 500, height: 24 }, {
    fontSize: 12,
    bold: true,
    color,
  });
}

async function slideOne(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = INK;
  addBox(slide, { left: 0, top: 0, width: W, height: 8 }, SIGNAL, "signal-line");
  await addLogo(slide, "light");
  addEyebrow(slide, "Evidence-led ecosystem discovery", 72, 125, "#C6CAC7");
  addText(slide, "Canada is building\nmore than most\npeople can see.", { left: 72, top: 168, width: 565, height: 185 }, {
    fontSize: 48,
    bold: true,
    color: PAPER,
    name: "title",
  });
  addText(slide, "True North Map makes Canadian defence and dual-use capability easier to find, understand and connect.", { left: 72, top: 378, width: 530, height: 86 }, {
    fontSize: 20,
    color: "#D8DAD8",
  });
  addBox(slide, { left: 72, top: 504, width: 375, height: 46 }, SIGNAL, "brand-promise");
  addText(slide, "MAKE CANADIAN CAPABILITY VISIBLE.", { left: 91, top: 518, width: 340, height: 24 }, {
    fontSize: 16,
    bold: true,
    color: INK,
  });
  await addImage(
    slide,
    path.join(screenshots, "homepage-desktop.png"),
    { left: 693, top: 92, width: 515, height: 523 },
    "True North Map homepage and national discovery experience",
    "cover",
  );
  addRule(slide, 666, 92, 5, SIGNAL, 523);
  addText(slide, "PUBLIC BETA", { left: 72, top: 621, width: 160, height: 22 }, {
    fontSize: 12,
    bold: true,
    color: SIGNAL,
  });
  addFooter(slide, 1, true);
  setNotes(slide, "Open with the visibility problem. True North Map is a discovery and decision-support layer, not a company directory with better styling.", [
    "https://truenorthmap.ca/",
    "Local screenshot: content/launch/broader-public-beta-2026-08/screenshots/homepage-desktop.png",
    "True North Map Project Overview, reviewed 2026-07-31",
  ]);
}

async function slideTwo(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = FIELD;
  await addLogo(slide);
  addEyebrow(slide, "The problem", 72, 118);
  addText(slide, "Visibility breaks down before the work begins.", { left: 72, top: 153, width: 530, height: 110 }, {
    fontSize: 42,
    bold: true,
    color: INK,
  });
  addText(slide, "Canadian capability is spread across company pages, program lists, regional networks, technical language and public releases.", { left: 72, top: 280, width: 500, height: 95 }, {
    fontSize: 19,
    color: QUIET,
  });
  const statements = [
    ["Find", "the organizations and technologies that matter."],
    ["Understand", "why they may fit a mission or released public need."],
    ["Act", "with the evidence, limits and next step in view."],
  ];
  let y = 406;
  for (const [verb, copy] of statements) {
    addBox(slide, { left: 72, top: y + 4, width: 8, height: 28 }, SIGNAL, `signal-${verb}`);
    addText(slide, verb, { left: 98, top: y, width: 138, height: 32 }, { fontSize: 20, bold: true, color: INK });
    addText(slide, copy, { left: 248, top: y + 2, width: 357, height: 42 }, { fontSize: 16, color: QUIET });
    y += 67;
  }
  await addImage(
    slide,
    path.join(screenshots, "organizations-desktop.png"),
    { left: 650, top: 118, width: 558, height: 496 },
    "True North Map organization directory",
    "cover",
  );
  addRule(slide, 650, 622, 558, SIGNAL, 4);
  addFooter(slide, 2);
  setNotes(slide, "Frame the product around the work the user is trying to complete. The organization corpus matters because it supports a more useful decision path.", [
    "https://truenorthmap.ca/organizations",
    "Local screenshot: content/launch/broader-public-beta-2026-08/screenshots/organizations-desktop.png",
    "True North Map Project Overview, reviewed 2026-07-31",
  ]);
}

async function slideThree(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = PAPER;
  addBox(slide, { left: 0, top: 0, width: W, height: 8 }, SIGNAL, "signal-line");
  await addLogo(slide);
  addEyebrow(slide, "A mission-led entry point", 72, 114);
  addText(slide, "Start with the mission, not a company list.", { left: 72, top: 149, width: 760, height: 104 }, {
    fontSize: 40,
    bold: true,
  });
  addText(slide, "Mission Areas turn a practical operating problem into a reviewed landscape of organizations, technologies and released Public Needs.", { left: 72, top: 260, width: 760, height: 56 }, {
    fontSize: 18,
    color: QUIET,
  });
  await addImage(
    slide,
    path.join(screenshots, "missions-desktop.png"),
    { left: 72, top: 330, width: 1136, height: 310 },
    "True North Map Mission Areas index",
    "cover",
  );
  addBox(slide, { left: 900, top: 264, width: 308, height: 48 }, SIGNAL_WASH, "mission-caveat");
  addText(slide, "A reviewed assessment layer, not a claim of customer demand.", { left: 916, top: 278, width: 276, height: 28 }, {
    fontSize: 13,
    bold: true,
    color: INK,
  });
  addFooter(slide, 3);
  setNotes(slide, "Explain the distinction between Mission Areas and Public Needs. Mission Areas organize reviewed capability relationships. Public Needs are grounded in released public sources.", [
    "https://truenorthmap.ca/missions",
    "Local screenshot: content/launch/broader-public-beta-2026-08/screenshots/missions-desktop.png",
    "True North Map Project Overview, Terms and language map, reviewed 2026-07-31",
  ]);
}

function slideFour(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = FIELD;
  addBox(slide, { left: 0, top: 0, width: W, height: 8 }, SIGNAL, "signal-line");
  addEyebrow(slide, "The intelligence layer", 72, 76);
  addText(slide, "Connect what exists to why it matters.", { left: 72, top: 112, width: 900, height: 72 }, {
    fontSize: 42,
    bold: true,
  });
  addText(slide, "Each step keeps the record, the interpretation and the next action separate.", { left: 72, top: 190, width: 760, height: 36 }, {
    fontSize: 18,
    color: QUIET,
  });

  const stages = [
    ["01", "Mission", "Start with the use case or operating problem."],
    ["02", "Technology", "See reviewed Canadian capability."],
    ["03", "Public need", "Follow a released, source-gated signal."],
    ["04", "Evidence", "Inspect support, strength and visible gaps."],
    ["05", "Action", "Build a Working List or start a conversation."],
  ];
  const startX = 72;
  const stageW = 198;
  const gap = 35;
  const top = 300;

  for (let index = 0; index < stages.length - 1; index += 1) {
    const x = startX + index * (stageW + gap);
    addRule(slide, x + stageW, top + 43, gap, GREEN, 2);
    addText(slide, "→", { left: x + stageW + 7, top: top + 27, width: 22, height: 32 }, {
      fontSize: 22,
      bold: true,
      color: GREEN,
      alignment: "center",
    });
  }

  stages.forEach(([number, title, copy], index) => {
    const x = startX + index * (stageW + gap);
    addBox(slide, { left: x, top, width: 42, height: 42 }, SIGNAL, `step-${number}`);
    addText(slide, number, { left: x, top: top + 10, width: 42, height: 24 }, {
      fontSize: 14,
      bold: true,
      alignment: "center",
    });
    addText(slide, title, { left: x, top: top + 66, width: stageW, height: 36 }, {
      fontSize: 24,
      bold: true,
    });
    addText(slide, copy, { left: x, top: top + 114, width: stageW, height: 78 }, {
      fontSize: 16,
      color: QUIET,
    });
  });

  addBox(slide, { left: 72, top: 550, width: 1136, height: 72 }, INK, "trust-boundary");
  addText(slide, "Sources create the public record. People review the interpretation. AI helps people explore, but it does not publish facts or make procurement decisions.", { left: 102, top: 570, width: 1076, height: 40 }, {
    fontSize: 17,
    bold: true,
    color: PAPER,
    alignment: "center",
  });
  addFooter(slide, 4);
  setNotes(slide, "Use this slide to show why the product is more than web scraping. Data enters a reviewed relationship model, and the public experience keeps evidence, assessment and action distinct.", [
    "True North Map Project Overview, Evidence, review, and publication flow, reviewed 2026-07-31",
    "https://truenorthmap.ca/how-it-works",
  ]);
}

async function slideFive(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = PAPER;
  await addLogo(slide);
  addEyebrow(slide, "Evidence and governance", 72, 116);
  addText(slide, "Every public connection stays reviewable.", { left: 72, top: 151, width: 620, height: 74 }, {
    fontSize: 42,
    bold: true,
  });
  await addImage(
    slide,
    path.join(screenshots, "public-need-detail-desktop.png"),
    { left: 72, top: 255, width: 650, height: 358 },
    "True North Map Public Need detail and evidence view",
    "cover",
  );
  addRule(slide, 72, 620, 650, SIGNAL, 4);

  const process = [
    ["01", "Durable public source", "Company, government, allied or program evidence."],
    ["02", "Structured candidate", "Facts, citations, confidence and gaps stay attached."],
    ["03", "Private review", "A person edits, accepts, defers or rejects the proposed change."],
    ["04", "Explicit publication", "Only the publish checkpoint changes the public record."],
  ];
  let y = 264;
  process.forEach(([number, title, copy]) => {
    addText(slide, number, { left: 770, top: y, width: 42, height: 28 }, { fontSize: 14, bold: true, color: GREEN });
    addText(slide, title, { left: 822, top: y - 2, width: 360, height: 32 }, { fontSize: 21, bold: true });
    addText(slide, copy, { left: 822, top: y + 31, width: 360, height: 46 }, { fontSize: 15, color: QUIET });
    y += 86;
  });
  addBox(slide, { left: 770, top: 612, width: 412, height: 42 }, SIGNAL_WASH, "public-boundary");
  addText(slide, "No agent, feed or model can publish autonomously.", { left: 786, top: 624, width: 380, height: 22 }, {
    fontSize: 14,
    bold: true,
  });
  addFooter(slide, 5);
  setNotes(slide, "Describe the review-first publication boundary. Automation helps find and structure possible updates. Human review and a separate publish checkpoint remain mandatory.", [
    "https://truenorthmap.ca/demand/land-formation-combat-effectiveness",
    "Local screenshot: content/launch/broader-public-beta-2026-08/screenshots/public-need-detail-desktop.png",
    "True North Map Project Overview, Evidence, review, and publication flow, reviewed 2026-07-31",
  ]);
}

async function slideSix(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = INK;
  addBox(slide, { left: 0, top: 0, width: W, height: 8 }, SIGNAL, "signal-line");
  await addLogo(slide, "light");
  addEyebrow(slide, "From discovery to action", 72, 116, "#C6CAC7");
  addText(slide, "Move into a better conversation.", { left: 72, top: 151, width: 520, height: 112 }, {
    fontSize: 46,
    bold: true,
    color: PAPER,
  });
  const actions = [
    ["Inspect", "the organization, technology, evidence and current gaps."],
    ["Compare", "possible relevance across Mission Areas and released Public Needs."],
    ["Carry", "the right targets into a Working List, export or introduction request."],
  ];
  let y = 315;
  actions.forEach(([verb, copy]) => {
    addBox(slide, { left: 72, top: y + 3, width: 8, height: 30 }, SIGNAL, `action-${verb}`);
    addText(slide, verb, { left: 98, top: y, width: 140, height: 32 }, { fontSize: 20, bold: true, color: PAPER });
    addText(slide, copy, { left: 250, top: y + 1, width: 335, height: 55 }, { fontSize: 16, color: "#D8DAD8" });
    y += 82;
  });
  await addImage(
    slide,
    path.join(screenshots, "organization-kraken-desktop.png"),
    { left: 650, top: 118, width: 558, height: 494 },
    "True North Map organization profile for Kraken Robotics",
    "cover",
  );
  addRule(slide, 650, 620, 558, SIGNAL, 4);
  addFooter(slide, 6, true);
  setNotes(slide, "The final value is not another profile page. It is a supported next move: compare, save, correct, share or ask for a relevant introduction.", [
    "https://truenorthmap.ca/organizations/kraken-robotics",
    "Local screenshot: content/launch/broader-public-beta-2026-08/screenshots/organization-kraken-desktop.png",
    "True North Map Project Overview, Current product surface, reviewed 2026-07-31",
  ]);
}

async function slideSeven(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = SIGNAL;
  await addLogo(slide, "dark", { left: 72, top: 54, width: 250, height: 48 });
  addText(slide, "Try one real question\nfrom your work.", { left: 72, top: 160, width: 690, height: 175 }, {
    fontSize: 56,
    bold: true,
    color: INK,
  });
  addText(slide, "Start with a capability, mission or public need you are trying to understand. Inspect the evidence, follow the fit and decide who may be worth speaking with next.", { left: 72, top: 370, width: 675, height: 92 }, {
    fontSize: 21,
    color: INK,
  });
  addBox(slide, { left: 850, top: 155, width: 358, height: 358 }, INK, "closing-field");
  await addImage(slide, path.join(brand, "true-north-map-social-avatar.png"), { left: 970, top: 205, width: 118, height: 118 }, "True North Map Directional N", "contain");
  addText(slide, "MAKE CANADIAN\nCAPABILITY VISIBLE.", { left: 892, top: 350, width: 274, height: 92 }, {
    fontSize: 26,
    bold: true,
    color: PAPER,
    alignment: "center",
  });
  addText(slide, "truenorthmap.ca", { left: 72, top: 535, width: 620, height: 54 }, {
    fontSize: 32,
    bold: true,
    color: INK,
  });
  addText(slide, "Independent project created and stewarded by Andrew Davies", { left: 72, top: 606, width: 650, height: 28 }, {
    fontSize: 14,
    color: INK,
  });
  addText(slide, "07", { left: 1170, top: 678, width: 38, height: 18 }, {
    fontSize: 11,
    bold: true,
    color: INK,
    alignment: "right",
  });
  setNotes(slide, "Close with one low-effort ask: try a real work question, then decide whether the record moves the user closer to a useful conversation.", [
    "https://truenorthmap.ca/",
    "True North Map response guide, current broader public beta launch kit",
  ]);
}

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(directRenderDir, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  await slideOne(presentation);
  await slideTwo(presentation);
  await slideThree(presentation);
  slideFour(presentation);
  await slideFive(presentation);
  await slideSix(presentation);
  await slideSeven(presentation);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(directRenderDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(directRenderDir, `${stem}.layout.json`), await layout.text());
  }

  await writeBlob(
    path.join(directRenderDir, "partner-and-media-deck-montage.webp"),
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outputPptx);
  console.log(outputPptx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
