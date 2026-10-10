// Sign in from the terminal: OAuth 2.0 device authorization grant (RFC 8628).
// The person approves a short code in the dashboard; the key comes back here once.
"use strict";

const { spawn } = require("node:child_process");
const os = require("node:os");

async function post(origin, route, body) {
  let response;
  try {
    response = await fetch(`${origin}${route}`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "user-agent": "ephemeris-mcp" },
      body: JSON.stringify(body),
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("couldn't reach Ephemeris. Check your connection and run ephemeris-mcp login again.");
  }
  let data = {};
  try { data = (await response.json()) || {}; } catch { /* not JSON: never echo it */ }
  return { status: response.status, data };
}

function openBrowser(url) {
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", '""', url]]
      : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch { return false; }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns the new key. say(text) tells the person the code and link.
async function deviceLogin({ origin, say, browser = true, client = "ephemeris-mcp" }) {
  const start = await post(origin, "/api/v1/device/code", { client, name: `${client} on ${os.hostname() || "this machine"}` });
  if (start.status === 404 || start.status === 405) {
    throw new Error("this Ephemeris doesn't offer sign-in from the terminal. Create a key at https://ephemeris.cascade.industries/dashboard/api-keys and set EPHEMERIS_API_KEY.");
  }
  if (start.status === 429) throw new Error("too many sign-in attempts from this network. Wait a few minutes and try again.");
  const { device_code: deviceCode, user_code: userCode, verification_uri: uri, verification_uri_complete: complete } = start.data;
  if (start.status !== 200 || typeof deviceCode !== "string" || typeof userCode !== "string" || typeof uri !== "string") {
    throw new Error(`sign-in could not start (HTTP ${start.status}).`);
  }
  const link = typeof complete === "string" ? complete : uri;
  const opened = browser && openBrowser(link);
  say(`Your code: ${userCode}\n${opened ? "Opened" : "Open"} ${link}\nCheck the page shows ${userCode}, then approve. Waiting...`);
  let interval = Number.isFinite(start.data.interval) ? Math.max(0, start.data.interval) : 5;
  const until = Date.now() + 1000 * (Number(start.data.expires_in) || 600);
  while (Date.now() < until) {
    await sleep(interval * 1000);
    const poll = await post(origin, "/api/v1/device/token", { device_code: deviceCode });
    if (poll.status === 200 && typeof poll.data.key === "string" && poll.data.key) return poll.data.key;
    const error = poll.data.error;
    if (error === "slow_down") interval += 5;
    else if (error === "access_denied") throw new Error("sign-in was denied in the browser. Nothing was saved.");
    else if (error === "expired_token") throw new Error("the code expired. Run ephemeris-mcp login again.");
    else if (error !== "authorization_pending" && error !== "pending") throw new Error(`sign-in failed (${error || `HTTP ${poll.status}`}). Run ephemeris-mcp login again.`);
  }
  throw new Error("the code expired. Run ephemeris-mcp login again.");
}

module.exports = { deviceLogin, openBrowser };
