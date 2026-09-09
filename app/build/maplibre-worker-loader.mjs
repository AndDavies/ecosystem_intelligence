// MapLibre's distributed worker imports a sibling shared module. Bundle both before
// webpack emits the URL asset so production workers do not request a missing sibling.
import { buildSync } from "esbuild";

export default function maplibreWorkerLoader() {
  return buildSync({
    entryPoints: [this.resourcePath],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: true
  }).outputFiles[0].text;
};
