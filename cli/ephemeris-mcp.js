#!/usr/bin/env node
// Stdio entry point for MCP clients that only launch local servers.
//
// Ephemeris is a remote MCP server (Streamable HTTP). This bridges it to stdio
// with mcp-remote, adding the bearer header for your API key. The key comes from
// EPHEMERIS_API_KEY, else the file `ephemeris-mcp login` (or `ephemeris auth login`)
// saved. It goes to mcp-remote through a private temporary header file, not the
// command line, so it never shows in the process list.
//
//   ephemeris-mcp login [--no-browser]   sign in in the browser and save a key
//   ephemeris-mcp logout                 delete the saved key file
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { readKey, saveKey, removeKey } = require("./credentials");

const DEFAULT_MCP_URL = "https://ephemeris.cascade.industries/api/mcp";
const args = process.argv.slice(2);

if (args.length === 1 && args[0] === "--version") {
  process.stdout.write(require("../package.json").version + "\n");
  process.exit(0);
}

if (args[0] === "login") {
  const { deviceLogin } = require("./login");
  const origin = process.env.EPHEMERIS_BASE_URL || new URL(process.env.EPHEMERIS_MCP_URL || DEFAULT_MCP_URL).origin;
  deviceLogin({ origin, browser: !args.includes("--no-browser"), say: (text) => process.stderr.write(text + "\n") })
    .then((key) => {
      const file = saveKey(key);
      const envSet = Boolean((process.env.EPHEMERIS_API_KEY || "").trim());
      process.stderr.write(`Signed in. Key saved to ${file} (readable by you only).\n` +
        (envSet ? "EPHEMERIS_API_KEY is set and still wins over the saved key until you unset it.\n"
          : "Your MCP client can now start ephemeris-mcp with no key in its config.\n"));
      process.exit(0);
    })
    .catch((error) => { process.stderr.write(`ephemeris-mcp login: ${error.message}\n`); process.exit(1); });
  return;
}

if (args[0] === "logout") {
  const { path: file, removed } = removeKey();
  process.stderr.write(removed ? `Deleted ${file}. The key stays valid until you revoke it at https://ephemeris.cascade.industries/dashboard/api-keys\n`
    : `No saved key at ${file}.\n`);
  process.exit(0);
}

const credential = readKey();
const key = credential.key;
if (!key) {
  process.stderr.write(credential.unsafe
    ? `ephemeris-mcp: ${credential.path} can be read by other users, so it isn't used. Run chmod 600 ${credential.path}, or ephemeris-mcp login again.\n`
    : "ephemeris-mcp: no API key. Run `npx ephemeris-mcp login` once in a terminal (it opens your browser),\n" +
      "or set EPHEMERIS_API_KEY (create one at https://ephemeris.cascade.industries/dashboard/api-keys).\n");
  process.exit(1);
}

const url = process.env.EPHEMERIS_MCP_URL || DEFAULT_MCP_URL;
const bridge = require.resolve("mcp-remote/package.json");
const bin = require(bridge).bin;
const entry = path.join(path.dirname(bridge), typeof bin === "string" ? bin : bin["mcp-remote"]);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ephemeris-mcp-"));
const headerFile = path.join(dir, "headers");
fs.writeFileSync(headerFile, `Authorization: Bearer ${key}\n`, { mode: 0o600 });
const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });

const child = spawn(
  process.execPath,
  [entry, url, "--transport", "http-only", "--header-file", headerFile],
  { stdio: "inherit" }
);
child.on("exit", (code, signal) => {
  cleanup();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
