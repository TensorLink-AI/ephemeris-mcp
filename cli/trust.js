// Roots behind the October 2026 eMudhra intermediate CA compromise
// (https://bugzilla.mozilla.org/show_bug.cgi?id=2083449). Node 22.23.4, 24.22.1
// and 26.12.1 drop them; older runtimes, and Node 20, accept the compromised chains.
"use strict";

const { X509Certificate } = require("node:crypto");
const tls = require("node:tls");

const DISTRUSTED_ROOTS = {
  "86A1ECBA089C4A8D3BBE2734C612BA341D813E043CF9E8A862CD5C57A36BBE6B": "emSign ECC Root CA - G3",
  "7DD78D5F4F13459A83DFF9ABBBA62EDBAF6F2D102BF257FD712F4D9F2746ED8D": "emSign Root TLS CA - G3",
  "F2EDAAFF3D9B701FB4D14C9F285F8C0BAD90FC3BCC1FA07D47F4718EDABA34A5": "emSign Root CS CA - G3",
};

function distrustedRoots(pems) {
  const found = new Set();
  for (const pem of pems) {
    const name = DISTRUSTED_ROOTS[new X509Certificate(pem).fingerprint256.replace(/:/g, "")];
    if (name) found.add(name);
  }
  return [...found];
}

// The default set includes system and NODE_EXTRA_CA_CERTS roots when configured.
function defaultCertificates() {
  return typeof tls.getCACertificates === "function" ? tls.getCACertificates("default") : tls.rootCertificates;
}

// Message explaining why the key must not be sent to url from this runtime, or null.
function untrustedRuntime(url, pems = defaultCertificates()) {
  if (new URL(url).protocol !== "https:") return null;
  const found = distrustedRoots(pems);
  return found.length
    ? `Node ${process.version} trusts the compromised eMudhra CA (${found.join(", ")}), so your API key could be intercepted. ` +
      "Upgrade to Node 22.23.4, 24.22.1, 26.12.1 or later. Nothing was sent."
    : null;
}

module.exports = { distrustedRoots, untrustedRuntime };
