import { loadEnvConfig } from "@next/env";

let loaded = false;

export function loadScriptEnv() {
  if (loaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  loaded = true;
}
