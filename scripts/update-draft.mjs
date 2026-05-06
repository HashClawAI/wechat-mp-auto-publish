/**
 * Update an existing WeChat draft (draft/update) by media_id.
 * Docs: https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_update.html
 *
 * Usage:
 *   DRY_RUN=1 node scripts/update-draft.mjs --media-id <MEDIA_ID> --article path/to/article.json
 *   DRY_RUN=0 node scripts/update-draft.mjs --media-id <MEDIA_ID> --article path/to/article.json
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv, boolEnv, trimEnv, writeArtifact } from "./lib/env.mjs";
import { fetchJson, getStableAccessToken } from "./lib/wechat-api.mjs";
import { buildRenderedArticle } from "./lib/article-package.mjs";

function parseArgs(argv) {
  let articlePath = trimEnv("WECHAT_ARTICLE_JSON_PATH") || "";
  let mediaId = "";
  let index = 0;

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--article") {
      articlePath = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--media-id") {
      mediaId = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--index") {
      index = Number(argv[i + 1] || "0");
      i += 1;
    }
  }

  return { articlePath, mediaId, index };
}

function readArticlePackage(articlePath) {
  if (!articlePath) return null;
  const raw = readFileSync(resolve(process.cwd(), articlePath), "utf8");
  return JSON.parse(raw);
}

function normalizeArticlePackage(articlePackage) {
  if (!articlePackage) return null;
  return buildRenderedArticle(articlePackage);
}

function buildNewsArticle(articlePackage) {
  const normalized = normalizeArticlePackage(articlePackage);
  const title = String(normalized?.title || trimEnv("WECHAT_ARTICLE_TITLE") || "").trim();
  const content = String(normalized?.content_html || trimEnv("WECHAT_ARTICLE_CONTENT") || "").trim();
  const thumb = String(normalized?.thumb_media_id || trimEnv("WECHAT_THUMB_MEDIA_ID") || "").trim();

  if (!title) throw new Error("Missing article title. Set WECHAT_ARTICLE_TITLE or provide article package title.");
  if (!content) throw new Error("Missing article HTML content. Set WECHAT_ARTICLE_CONTENT or provide article package content_html.");

  const article = {
    article_type: "news",
    title,
    content,
    thumb_media_id: thumb,
  };

  const author = String(normalized?.author || trimEnv("WECHAT_ARTICLE_AUTHOR") || "").trim();
  if (author) article.author = author;

  const digest = String(normalized?.digest || trimEnv("WECHAT_ARTICLE_DIGEST") || "").trim();
  if (digest) article.digest = digest;

  const source = String(normalized?.source_url || trimEnv("WECHAT_CONTENT_SOURCE_URL") || "").trim();
  if (source) article.content_source_url = source;

  return article;
}

async function main() {
  loadDotEnv();
  const { articlePath, mediaId, index } = parseArgs(process.argv);

  if (!mediaId) {
    console.error("Missing --media-id (draft media_id).");
    process.exit(1);
  }
  if (!Number.isFinite(index) || index < 0) {
    console.error("Invalid --index; must be >= 0.");
    process.exit(1);
  }

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    console.error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET (or .env).");
    process.exit(1);
  }

  const dryRun = boolEnv("DRY_RUN", true);
  const token = await getStableAccessToken(appid, secret);
  console.error(`access_token acquired (length ${token.length})`);

  const articlePackage = readArticlePackage(articlePath);
  const article = buildNewsArticle(articlePackage);

  const body = {
    media_id: mediaId,
    index,
    articles: article,
  };

  writeArtifact("artifacts/last-draft-update-body.json", `${JSON.stringify(body, null, 2)}\n`);

  if (dryRun) {
    console.log(JSON.stringify({ dry_run: true, draft_update_body: body }, null, 2));
    return;
  }

  if (!article.thumb_media_id) {
    console.error("DRY_RUN=0 requires WECHAT_THUMB_MEDIA_ID or article package thumb_media_id for news draft updates.");
    process.exit(1);
  }

  const url = `https://api.weixin.qq.com/cgi-bin/draft/update?access_token=${encodeURIComponent(token)}`;
  const { res, data } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) console.error(`draft/update HTTP ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (data.errcode && data.errcode !== 0) process.exit(1);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

