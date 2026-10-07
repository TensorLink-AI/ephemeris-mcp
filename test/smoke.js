#!/usr/bin/env node
// Smoke test: start the stdio bridge against the live server and list tools.
// Listing needs no real key (the server allows discovery without one), so a
// placeholder is enough; a forecast call would be rejected.
"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");

const EXPECTED = ["forecast", "get_balance", "get_usage", "list_models"];
const child = spawn(process.execPath, [path.join(__dirname, "..", "cli", "ephemeris-mcp.js")], {
  env: { ...process.env, EPHEMERIS_API_KEY: process.env.EPHEMERIS_API_KEY || "pc_live_placeholder" },
  stdio: ["pipe", "pipe", "inherit"],
});
const send = (msg) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
const fail = (why) => { console.error(`smoke: ${why}`); child.kill(); process.exit(1); };
setTimeout(() => fail("timed out after 60s"), 60_000).unref();

let buf = "";
child.stdout.on("data", (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id === 1) {
      if (!msg.result) fail(`initialize failed: ${JSON.stringify(msg.error)}`);
      send({ method: "notifications/initialized" });
      send({ id: 2, method: "tools/list" });
    } else if (msg.id === 2) {
      const names = (msg.result?.tools || []).map((t) => t.name).sort();
      const missing = EXPECTED.filter((n) => !names.includes(n));
      if (missing.length) fail(`missing tools: ${missing.join(", ")} (got ${names.join(", ")})`);
      console.log(`smoke: ok, tools ${names.join(", ")}`);
      child.kill();
      process.exit(0);
    }
  }
});
child.on("exit", (code) => fail(`bridge exited early (code ${code})`));

send({
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "ephemeris-smoke", version: "1" } },
});
