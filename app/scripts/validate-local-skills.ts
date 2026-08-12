import path from "node:path";
import { validateProjectSkills } from "../src/lib/research/skill-validation";

const workspaceRoot = path.resolve(process.cwd(), "..");

async function main() {
  const result = await validateProjectSkills(workspaceRoot);
  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warning");

  console.log(`True North Map skill validation\nSkills: ${result.skillCount}\nErrors: ${errors.length}\nWarnings: ${warnings.length}`);
  for (const issue of result.issues) console.log(`${issue.level.toUpperCase()}: ${issue.file}: ${issue.message}`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
