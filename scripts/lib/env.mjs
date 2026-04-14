import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function loadDotEnv(cwd = process.cwd()) {
  try {
    const raw = readFileSync(resolve(cwd, ".env"), "utf8");
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

export function boolEnv(name, defaultValue = false) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return defaultValue;
}

export function trimEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export function intFlag(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const s = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return 1;
  if (["0", "false", "no", "off"].includes(s)) return 0;
  const n = Number(value);
  return Number.isFinite(n) && (n === 0 || n === 1) ? n : fallback;
}

export function writeArtifact(relativePath, content) {
  const filePath = resolve(process.cwd(), relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  return filePath;
}
