#!/usr/bin/env node
// Offline test: ephemeris-mcp login against a fake service, the shared key file,
// logout, and the bridge sending the saved key. No network beyond 127.0.0.1.
"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const bin = path.join(__dirname, "..", "cli", "ephemeris-mcp.js");
const issued = "pc_live_device_issued_never_print";
const seen = { polls: 0, mcpAuth: null, start: null };

const server = http.createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  const send = (status, data) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };
  if (req.url === "/api/v1/device/code") {
    seen.start = JSON.parse(body);
    return send(200, { device_code: "dev_code_secret_xxxxxxxxxxxx", user_code: "WDJB-MJHT", verification_uri: "http://x/dashboard/device", verification_uri_complete: "http://x/dashboard/device?code=WDJB-MJHT", expires_in: 600, interval: 0 });
  }
  if (req.url === "/api/v1/device/token") {
    seen.polls += 1;
    return seen.polls === 1 ? send(400, { error: "authorization_pending" }) : send(200, { key: issued });
  }
  if (req.url.startsWith("/api/mcp")) {
    seen.mcpAuth = req.headers.authorization;
    return send(401, { error: "test server" });
  }
  send(404, {});
});

function run(argv, env, stdin) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [bin, ...argv], { env: { ...process.env, EPHEMERIS_API_KEY: "", ...env }, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (c) => { out += c; });
    child.stderr.on("data", (c) => { err += c; });
    if (stdin) child.stdin.write(stdin); else child.stdin.end();
    const timer = setTimeout(() => child.kill(), 8000);
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "eph-mcp-login-"));
  const file = path.join(dir, "credentials");
  const env = { EPHEMERIS_BASE_URL: base, EPHEMERIS_MCP_URL: `${base}/api/mcp`, EPHEMERIS_CREDENTIALS_FILE: file };
  try {
    let r = await run([], env);
    assert.equal(r.code, 1);
    assert.match(r.err, /npx ephemeris-mcp login/);

    r = await run(["login", "--no-browser"], env);
    assert.equal(r.code, 0, r.err);
    assert.match(r.err, /WDJB-MJHT/);
    assert.ok(!r.err.includes(issued) && !r.out.includes(issued));
    assert.equal(seen.start.client, "ephemeris-mcp");
    assert.equal(fs.readFileSync(file, "utf8").trim(), `EPHEMERIS_API_KEY=${issued}`);
    if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o777, 0o600);

    // the bridge sends the saved key to the MCP server
    const init = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "0" } } }) + "\n";
    const bridged = await run([], env, init);
    if (seen.mcpAuth === null) console.error(bridged.err.slice(0, 1500));
    assert.equal(seen.mcpAuth, `Bearer ${issued}`);

    if (process.platform !== "win32") {
      fs.chmodSync(file, 0o644);
      r = await run([], env);
      assert.equal(r.code, 1);
      assert.match(r.err, /chmod 600/);
      fs.chmodSync(file, 0o600);
    }

    r = await run(["logout"], env);
    assert.equal(r.code, 0);
    assert.ok(!fs.existsSync(file));
    console.log("login: ok");
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
