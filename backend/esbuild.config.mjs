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

await build({
  entryPoints: {
    handler: "src/functions/attempts/complete/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/complete",
  sourcemap: true
});

await build({
  entryPoints: {
    handler: "src/functions/attempts/getUserAttempts/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/getUserAttempts",
  sourcemap: true
});

await build({
  entryPoints: {
    handler: "src/functions/content/queryQuestions/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/content/queryQuestions",
  sourcemap: true
});

await build({
  entryPoints: {
    handler:
      "src/functions/attempts/getResult/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/getResult",
  sourcemap: true
});

await build({
  entryPoints: {
    handler:
      "src/functions/attempts/getQuestions/handler.ts"
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/getQuestions",
  sourcemap: true
});

await build({
  entryPoints: {
    handler:
    "src/functions/attempts/getStatistics/handler.ts",
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outdir: "dist/attempts/getStatistics",
  sourcemap: true
});
