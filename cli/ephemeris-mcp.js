#!/usr/bin/env node
// Stdio entry point for MCP clients that only launch local servers.
//
// Ephemeris is a remote MCP server (Streamable HTTP). This bridges it to stdio
// with mcp-remote, adding the bearer header from EPHEMERIS_API_KEY. The key goes
// to mcp-remote through a private temporary header file, not the command line,
// so it never shows in the process list.
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

if (process.argv.length === 3 && process.argv[2] === "--version") {
  process.stdout.write(require("../package.json").version + "\n");
  process.exit(0);
}

const key = (process.env.EPHEMERIS_API_KEY || "").trim();
if (!key) {
  process.stderr.write(
    "ephemeris-mcp: set EPHEMERIS_API_KEY to your Ephemeris API key (pc_live_...).\n" +
      "Create one at https://ephemeris.cascade.industries/dashboard/api-keys\n"
  );
  process.exit(1);
}

const url = process.env.EPHEMERIS_MCP_URL || "https://ephemeris.cascade.industries/api/mcp";
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
