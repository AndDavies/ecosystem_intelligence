import { execFileSync } from "node:child_process";
import path from "node:path";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbiddenPrefixes = [
  ".agents/skills/",
  ".playwright-cli/",
  ".tmp/",
  "app/test-results/",
  "content/launch/",
  "content/lookbook/",
  "output/",
  "research/audits/",
  "research/Beta Release Plan/",
  "research/north-signal/local/",
  "research/signals/local/",
  "research/visibility/local/",
  "sites/",
  "tmp/",
];
const forbiddenCredentialNames = new Set([
  "credentials.json",
  "credential.json",
  "service-account.json",
  "secret.json",
  "secrets.json",
  "id_rsa",
  "id_ed25519",
]);

function isCredentialPath(filePath) {
  const basename = path.posix.basename(filePath).toLowerCase();
  const isEnvironmentFile = basename.startsWith(".env") && !basename.endsWith(".example");
  return isEnvironmentFile
    || forbiddenCredentialNames.has(basename)
    || basename.endsWith(".pem")
    || basename.endsWith(".key");
}

const violations = tracked.filter((filePath) => filePath.endsWith("/.DS_Store")
  || filePath === ".DS_Store"
  || forbiddenPrefixes.some((prefix) => filePath.startsWith(prefix))
  || isCredentialPath(filePath));

if (violations.length) {
  console.error("Repository hygiene failed. Private, generated, credential, or superseded material is tracked:");
  for (const filePath of violations) console.error(`- ${filePath}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  trackedFiles: tracked.length,
  forbiddenTrackedFiles: 0,
  checkedPrivatePrefixes: forbiddenPrefixes.length,
}, null, 2));
