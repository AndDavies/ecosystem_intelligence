import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let loaded = false;

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");

  fileContents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const rawKey = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!rawKey || process.env[rawKey] !== undefined) {
      return;
    }

    process.env[rawKey] = stripWrappingQuotes(rawValue);
  });
}

export function loadScriptEnv() {
  if (loaded) {
    return;
  }

  const cwd = process.cwd();
  const envFiles = [".env.local", ".env"];

  envFiles.forEach((fileName) => {
    loadEnvFile(path.join(cwd, fileName));
  });

  loaded = true;
}
