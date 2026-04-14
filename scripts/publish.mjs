/**
 * Fetches stable access_token, loads an article package if provided, then optionally calls draft/add.
 * Docs: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/getStableAccessToken.html
 *       https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv, boolEnv, trimEnv, intFlag, writeArtifact } from "./lib/env.mjs";
import { fetchJson, getStableAccessToken } from "./lib/wechat-api.mjs";
import { buildRenderedArticle } from "./lib/article-package.mjs";

function parseArgs(argv) {
  let articlePath = trimEnv("WECHAT_ARTICLE_JSON_PATH") || "";
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--article") {
      articlePath = argv[i + 1] || "";
      i += 1;
    }
  }
  return { articlePath };
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
    need_open_comment: intFlag(normalized?.open_comment ?? process.env.WECHAT_NEED_OPEN_COMMENT, 0),
    only_fans_can_comment: intFlag(normalized?.only_fans_can_comment ?? process.env.WECHAT_ONLY_FANS_CAN_COMMENT, 0),
  };

  const author = String(normalized?.author || trimEnv("WECHAT_ARTICLE_AUTHOR") || "").trim();
  if (author) article.author = author;

  const digest = String(normalized?.digest || trimEnv("WECHAT_ARTICLE_DIGEST") || "").trim();
  if (digest) article.digest = digest;

  const source = String(normalized?.source_url || trimEnv("WECHAT_CONTENT_SOURCE_URL") || "").trim();
  if (source) article.content_source_url = source;

  const crop235 = trimEnv("WECHAT_PIC_CROP_235_1");
  if (crop235) article.pic_crop_235_1 = crop235;

  const crop11 = trimEnv("WECHAT_PIC_CROP_1_1");
  if (crop11) article.pic_crop_1_1 = crop11;

  return article;
}

async function main() {
  loadDotEnv();
  const { articlePath } = parseArgs(process.argv);

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
  const body = { articles: [article] };

  writeArtifact("artifacts/last-rendered.html", article.content);
  writeArtifact("artifacts/last-draft-body.json", `${JSON.stringify(body, null, 2)}\n`);

  if (dryRun) {
    console.log(JSON.stringify({ dry_run: true, article_path: articlePath || null, draft_add_body: body }, null, 2));
    return;
  }

  if (!article.thumb_media_id) {
    console.error("DRY_RUN=0 requires WECHAT_THUMB_MEDIA_ID or article package thumb_media_id for news drafts.");
    process.exit(1);
  }

  if (!dryRun && article.author === undefined) {
    console.error("Hint: set WECHAT_ARTICLE_AUTHOR in .env or article package author (≤16字) so 作者 is filled in the draft.");
  }

  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`;
  const { res, data } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) console.error(`draft/add HTTP ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (data.errcode && data.errcode !== 0) process.exit(1);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
