import { readFileSync } from "node:fs";
import { basename } from "node:path";

export async function fetchJson(url, init) {
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

export async function getStableAccessToken(appid, secret) {
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

export async function uploadThumb(token, filePath) {
  const buf = readFileSync(filePath);
  const name = basename(filePath);
  const blob = new Blob([buf]);
  const fd = new FormData();
  fd.append("media", blob, name);

  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
  const { res, data } = await fetchJson(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`add_material HTTP ${res.status}`);
  if (data.errcode) throw new Error(`add_material err ${data.errcode}: ${data.errmsg}`);
  return data.media_id;
}

export async function uploadInline(token, filePath) {
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
