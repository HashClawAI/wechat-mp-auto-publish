import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv, trimEnv, writeArtifact } from "./lib/env.mjs";
import { buildRenderedArticle } from "./lib/article-package.mjs";

function parseArgs(argv) {
  let articlePath = trimEnv("WECHAT_ARTICLE_JSON_PATH") || "";
  let outPath = "";
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--article") articlePath = argv[++i] || "";
    else if (arg === "--out") outPath = argv[++i] || "";
  }
  return { articlePath, outPath };
}

function loadArticlePackage(articlePath) {
  if (!articlePath) throw new Error("Missing article package path. Use --article or WECHAT_ARTICLE_JSON_PATH.");
  const raw = readFileSync(resolve(process.cwd(), articlePath), "utf8");
  return JSON.parse(raw);
}

function main() {
  loadDotEnv();
  const { articlePath, outPath } = parseArgs(process.argv);
  const pkg = loadArticlePackage(articlePath);
  const rendered = buildRenderedArticle(pkg);
  const htmlOut = outPath || "artifacts/last-rendered.html";
  writeArtifact(htmlOut, rendered.content_html);
  process.stdout.write(`${JSON.stringify(rendered, null, 2)}\n`);
}

main();
