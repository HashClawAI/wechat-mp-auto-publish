/**
 * Upload images for WeChat MP drafts.
 * thumb  -> permanent material (media_id for cover / thumb_media_id)
 * inline -> uploadimg (URL for <img src> in article HTML)
 */

import { resolve } from "node:path";
import { loadDotEnv } from "./lib/env.mjs";
import { getStableAccessToken, uploadThumb, uploadInline } from "./lib/wechat-api.mjs";

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
