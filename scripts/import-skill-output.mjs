import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv, writeArtifact } from "./lib/env.mjs";

function parseArgs(argv) {
  let inputPath = "";
  let outPath = "examples/article-package.generated.json";
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") inputPath = argv[++i] || "";
    else if (arg === "--out") outPath = argv[++i] || outPath;
  }
  return { inputPath, outPath };
}

function loadJson(path) {
  if (!path) throw new Error("Missing --input path for skill output JSON.");
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

function pickTitle(input) {
  if (typeof input.title === "string" && input.title.trim()) return input.title.trim();
  if (Array.isArray(input.title_options) && input.title_options[0]) return String(input.title_options[0]).trim();
  throw new Error("Skill output missing title/title_options");
}

function normalizeReferences(refs) {
  if (!Array.isArray(refs)) return [];
  return refs.map((ref) => (typeof ref === "string" ? ref : JSON.stringify(ref)));
}

function transformSkillOutput(input) {
  const title = pickTitle(input);
  const body = input.body_markdown || input.article || input.body || "";
  if (!String(body).trim() && !String(input.body_html || input.content_html || "").trim()) {
    throw new Error("Skill output missing body_markdown/article/body or body_html/content_html");
  }

  return {
    title,
    digest: String(input.digest || input.standfirst || "").trim(),
    author: String(input.author || "").trim(),
    standfirst: String(input.standfirst || "").trim(),
    body_markdown: String(body || "").trim(),
    content_html: String(input.body_html || input.content_html || "").trim(),
    references: normalizeReferences(input.references || input.evidence_notes || []),
    source_url: String(input.source_url || "").trim(),
    thumb_media_id: String(input.wechat?.thumb_media_id || input.thumb_media_id || "").trim(),
    open_comment: input.wechat?.open_comment ?? 1,
    only_fans_can_comment: input.wechat?.only_fans_can_comment ?? 0,
    metadata: {
      generated_by: input.metadata?.generated_by || "write-skill-academic-story",
      topic: input.metadata?.topic || "",
      style: input.metadata?.style || "academic-story",
      generated_at: input.metadata?.generated_at || new Date().toISOString(),
    },
  };
}

function main() {
  loadDotEnv();
  const { inputPath, outPath } = parseArgs(process.argv);
  const input = loadJson(inputPath);
  const articlePackage = transformSkillOutput(input);
  writeArtifact(outPath, `${JSON.stringify(articlePackage, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(articlePackage, null, 2)}\n`);
}

main();
