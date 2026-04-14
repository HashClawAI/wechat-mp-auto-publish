import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  let inputPath = "";
  let articlePath = "examples/article-package.generated.json";
  let renderOut = "artifacts/last-rendered.html";
  let dryRunOnly = false;
  const passThrough = [];

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") inputPath = argv[++i] || "";
    else if (arg === "--article") articlePath = argv[++i] || articlePath;
    else if (arg === "--render-out") renderOut = argv[++i] || renderOut;
    else if (arg === "--dry-run-only") dryRunOnly = true;
    else passThrough.push(arg);
  }

  return { inputPath, articlePath, renderOut, dryRunOnly, passThrough };
}

function runStep(label, args, extraEnv = {}) {
  console.error(`\n[${label}] node ${args.join(" ")}`);
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function ensureParent(path) {
  mkdirSync(dirname(resolve(process.cwd(), path)), { recursive: true });
}

function main() {
  const { inputPath, articlePath, renderOut, dryRunOnly, passThrough } = parseArgs(process.argv);
  if (!inputPath) {
    throw new Error("Missing --input path for skill output JSON.");
  }

  ensureParent(articlePath);
  ensureParent(renderOut);

  runStep("import", ["scripts/import-skill-output.mjs", "--input", inputPath, "--out", articlePath]);
  runStep("render", ["scripts/render-article.mjs", "--article", articlePath, "--out", renderOut]);
  runStep("publish", ["scripts/publish.mjs", "--article", articlePath, ...passThrough], {
    WECHAT_ARTICLE_JSON_PATH: articlePath,
    ...(dryRunOnly ? { DRY_RUN: "1" } : {}),
  });
}

main();
