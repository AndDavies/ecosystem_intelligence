import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbiddenPrefixes = ["content/launch/", "content/lookbook/", "research/audits/", "research/Beta Release Plan/"];
const violations = tracked.filter((path) => path.endsWith("/.DS_Store") || path === ".DS_Store" || forbiddenPrefixes.some((prefix) => path.startsWith(prefix)));

if (violations.length) {
  console.error("Repository hygiene failed. Generated or superseded collateral is tracked:");
  for (const path of violations) console.error(`- ${path}`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, trackedFiles: tracked.length, forbiddenTrackedFiles: 0 }, null, 2));
