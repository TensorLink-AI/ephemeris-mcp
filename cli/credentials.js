// The key file shared by every Ephemeris tool on the machine (ephemeris-cli, this
// bridge, savetokens): one line EPHEMERIS_API_KEY=pc_live_..., readable by its owner
// only. The EPHEMERIS_API_KEY environment variable always wins over the file.
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function credentialsPath(env = process.env) {
  if (env.EPHEMERIS_CREDENTIALS_FILE) return env.EPHEMERIS_CREDENTIALS_FILE;
  const base = process.platform === "win32"
    ? env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
    : env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "ephemeris", "credentials");
}

function parse(text) {
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().replace(/^export\s+/, "").match(/^EPHEMERIS_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return "";
}

// { key, source, path, unsafe }: the environment first, then the file.
function readKey(env = process.env) {
  const file = credentialsPath(env);
  const fromEnv = (env.EPHEMERIS_API_KEY || "").trim();
  if (fromEnv) return { key: fromEnv, source: "EPHEMERIS_API_KEY", path: file };
  let info;
  try { info = fs.statSync(file); } catch { return { key: "", source: null, path: file }; }
  if (process.platform !== "win32" && (info.mode & 0o077)) return { key: "", source: null, path: file, unsafe: true };
  let key = "";
  try { key = parse(fs.readFileSync(file, "utf8")); } catch { /* unreadable: treat as absent */ }
  return { key, source: key ? "credentials_file" : null, path: file };
}

function saveKey(key, env = process.env) {
  const file = credentialsPath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `EPHEMERIS_API_KEY=${key}\n`, { mode: 0o600 });
  fs.chmodSync(tmp, 0o600);
  fs.renameSync(tmp, file);
  return file;
}

function removeKey(env = process.env) {
  const file = credentialsPath(env);
  const existed = fs.existsSync(file);
  if (existed) fs.rmSync(file);
  return { path: file, removed: existed };
}

module.exports = { credentialsPath, readKey, saveKey, removeKey };
