import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const outdir = path.join(root, "dist");
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: [path.join(root, "src/bot/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(outdir, "index.mjs"),
  sourcemap: "linked",
  logLevel: "info",
  alias: {
    "@workspace/db/schema": path.join(root, "src/shared/db/schema/index.ts"),
    "@workspace/db": path.join(root, "src/shared/db/index.ts")
  },
  external: ["*.node", "pg-native"]
});
