/**
 * Upload images for WeChat MP drafts.
 * thumb  -> permanent material (media_id for cover / thumb_media_id)
 * inline -> uploadimg (URL for <img src> in article HTML)
 *
 * Docs (verify periodically):
 * - https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html
 * - search MP doc for material/add_material , media/uploadimg
 */

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

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
    // optional
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 500)}`);
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

async function uploadThumb(token, filePath) {
  const buf = readFileSync(filePath);
  const name = basename(filePath);
  const blob = new Blob([buf]);
  const fd = new FormData();
  fd.append("media", blob, name);

  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(
    token,
  )}&type=image`;

  const { res, data } = await fetchJson(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`add_material HTTP ${res.status}`);
  if (data.errcode) throw new Error(`add_material err ${data.errcode}: ${data.errmsg}`);
  return data.media_id;
}

async function uploadInline(token, filePath) {
  const buf = readFileSync(filePath);
  const name = basename(filePath);
  const blob = new Blob([buf]);
  const fd = new FormData();
  fd.append("media", blob, name);

  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(token)}`;

  const { res, data } = await fetchJson(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`uploadimg HTTP ${res.status}`);
  if (data.errcode) throw new Error(`uploadimg err ${data.errcode}: ${data.errmsg}`);
  if (!data.url) throw new Error("uploadimg: missing url in response");
  return data.url;
}

function usage() {
  console.error(`Usage:
  node scripts/upload-media.mjs thumb <image-file>
  node scripts/upload-media.mjs inline <image-file>

Requires WECHAT_APP_ID and WECHAT_APP_SECRET in .env (same as publish.mjs).`);
}

async function main() {
  loadDotEnv();
  const mode = process.argv[2];
  const filePath = process.argv[3];
  if (!mode || !filePath || !["thumb", "inline"].includes(mode)) {
    usage();
    process.exit(1);
  }

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    console.error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET.");
    process.exit(1);
  }

  const token = await getStableAccessToken(appid, secret);
  console.error(`access_token ok (length ${token.length})`);

  const abs = resolve(process.cwd(), filePath);
  if (mode === "thumb") {
    const mediaId = await uploadThumb(token, abs);
    console.log(JSON.stringify({ kind: "thumb", media_id: mediaId, env_hint: `WECHAT_THUMB_MEDIA_ID=${mediaId}` }, null, 2));
    return;
  }

  const imgUrl = await uploadInline(token, abs);
  console.log(JSON.stringify({ kind: "inline", url: imgUrl }, null, 2));
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
