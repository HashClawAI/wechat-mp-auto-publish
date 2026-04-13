/**
 * Fetches stable access_token, then optionally calls draft/add.
 * Docs: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/getStableAccessToken.html
 *       https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // .env optional if vars already exported
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 500)}`);
  }
  return { res, data };
}

async function getStableAccessToken(appid, secret) {
  const url = "https://api.weixin.qq.com/cgi-bin/stable_token";
  const { res, data } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credential",
      appid,
      secret,
      force_refresh: false,
    }),
  });
  if (!res.ok) throw new Error(`stable_token HTTP ${res.status}: ${JSON.stringify(data)}`);
  if (data.errcode) throw new Error(`stable_token err ${data.errcode}: ${data.errmsg}`);
  if (!data.access_token) throw new Error("stable_token: missing access_token");
  return data.access_token;
}

function boolEnv(name, defaultValue = false) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return defaultValue;
}

async function main() {
  loadDotEnv();

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    console.error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET (or .env).");
    process.exit(1);
  }

  const dryRun = boolEnv("DRY_RUN", true);
  const token = await getStableAccessToken(appid, secret);
  console.error(`access_token acquired (length ${token.length})`);

  const article = {
    article_type: "news",
    title: process.env.WECHAT_ARTICLE_TITLE || "Untitled",
    author: process.env.WECHAT_ARTICLE_AUTHOR || "",
    digest: process.env.WECHAT_ARTICLE_DIGEST || "",
    content: process.env.WECHAT_ARTICLE_CONTENT || "<p></p>",
    content_source_url: process.env.WECHAT_CONTENT_SOURCE_URL || "",
    thumb_media_id: process.env.WECHAT_THUMB_MEDIA_ID || "",
    need_open_comment: Number(process.env.WECHAT_NEED_OPEN_COMMENT || 0),
    only_fans_can_comment: Number(process.env.WECHAT_ONLY_FANS_CAN_COMMENT || 0),
  };

  const body = { articles: [article] };

  if (dryRun) {
    console.log(JSON.stringify({ dry_run: true, draft_add_body: body }, null, 2));
    return;
  }

  if (!article.thumb_media_id) {
    console.error("DRY_RUN=0 requires WECHAT_THUMB_MEDIA_ID for news drafts.");
    process.exit(1);
  }

  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`;
  const { res, data } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`draft/add HTTP ${res.status}`);
  }
  console.log(JSON.stringify(data, null, 2));
  if (data.errcode && data.errcode !== 0) process.exit(1);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
