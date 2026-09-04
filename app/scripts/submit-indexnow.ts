import process from "node:process";
import { loadScriptEnv } from "./load-env";
import {
  isValidIndexNowKey,
  singleUrlIndexNowPayload
} from "../src/lib/seo/indexnow";
import { submitSingleUrlIndexNow } from "../src/lib/seo/indexnow-submission";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

async function main() {
  loadScriptEnv();
  const pathname = argument("--path");
  const apply = process.argv.includes("--apply");
  if (!pathname) throw new Error("Provide one exact public path with --path.");

  const key = process.env.INDEXNOW_KEY?.trim();
  if (!isValidIndexNowKey(key)) {
    throw new Error("INDEXNOW_KEY must be configured with 8 to 128 letters, numbers, or dashes.");
  }

  const payload = singleUrlIndexNowPayload(key, pathname);
  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", url: payload.urlList[0], keyConfigured: true }, null, 2));
    return;
  }

  const result = await submitSingleUrlIndexNow(payload);

  console.log(JSON.stringify({
    mode: result.mode,
    url: payload.urlList[0],
    status: result.status
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
