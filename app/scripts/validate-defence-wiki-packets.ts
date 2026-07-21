import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { defenceSourcePacketV1Schema } from "../src/lib/research/defence-wiki-contract";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const root = argument("--root") ?? process.env.TNM_DEFENCE_WIKI_ROOT?.trim();
  if (!root) throw new Error("Pass --root or set TNM_DEFENCE_WIKI_ROOT. The validator never guesses a wiki root.");
  const rawDir = path.join(path.resolve(root), "raw");
  const files = (await readdir(rawDir)).filter((file) => file.endsWith(".json")).sort();
  const packetIds = new Set<string>();
  const errors: Array<{ file: string; error: string }> = [];
  const counts = { total: files.length, valid: 0, invalid: 0, crashboard: 0, true_north_map: 0, manual: 0 };

  for (const file of files) {
    try {
      const packet = defenceSourcePacketV1Schema.parse(JSON.parse(await readFile(path.join(rawDir, file), "utf8")));
      if (packetIds.has(packet.packetId)) throw new Error(`Duplicate packetId: ${packet.packetId}`);
      packetIds.add(packet.packetId);
      counts[packet.sourceSystem] += 1;
      counts.valid += 1;
    } catch (error) {
      counts.invalid += 1;
      errors.push({ file, error: error instanceof Error ? error.message : String(error) });
    }
  }

  process.stdout.write(`${JSON.stringify({
    schemaVersion: "defence-source-packet-validation-v1",
    root: path.resolve(root),
    dryRun: true,
    counts,
    errors,
    passed: errors.length === 0,
  }, null, 2)}\n`);
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
