import { build } from "esbuild";

await build({
  entryPoints: {
    handler: "src/functions/health/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/health",
  sourcemap: true
});

await build({
  entryPoints: {
    handler: "src/functions/attempts/create/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/create",
  sourcemap: true
});

await build({
  entryPoints: {
    handler: "src/functions/attempts/get/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/get",
  sourcemap: true
});

await build({
  entryPoints: {
    handler: "src/functions/attempts/updateAnswer/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/updateAnswer",
  sourcemap: true
});