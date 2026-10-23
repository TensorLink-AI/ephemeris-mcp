#!/usr/bin/env node
// Offline test: the bridge refuses to send a key from a runtime trusting the
// compromised eMudhra roots.
"use strict";

const assert = require("node:assert/strict");
const { distrustedRoots, untrustedRuntime } = require("../cli/trust");

// Bundled in Node 24.13.0; removed in 22.23.4, 24.22.1 and 26.12.1.
const EMSIGN_ECC_ROOT_G3 = `-----BEGIN CERTIFICATE-----
MIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBrMQswCQYDVQQGEwJJTjET
MBEGA1UECxMKZW1TaWduIFBLSTElMCMGA1UEChMcZU11ZGhyYSBUZWNobm9sb2dpZXMgTGlt
aXRlZDEgMB4GA1UEAxMXZW1TaWduIEVDQyBSb290IENBIC0gRzMwHhcNMTgwMjE4MTgzMDAw
WhcNNDMwMjE4MTgzMDAwWjBrMQswCQYDVQQGEwJJTjETMBEGA1UECxMKZW1TaWduIFBLSTEl
MCMGA1UEChMcZU11ZGhyYSBUZWNobm9sb2dpZXMgTGltaXRlZDEgMB4GA1UEAxMXZW1TaWdu
IEVDQyBSb290IENBIC0gRzMwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQjpQy4LRL1KPOxst3i
AhKAnjlfSU2fySU0WXTsuwYc58Byr+iuL+FBVIcUqEqy6HyC5ltqtdyzdc6LBtCGI79G1Y4P
PwT01xySfvalY8L1X44uT6EYGQIrMgqCZH0Wk9GjQjBAMB0GA1UdDgQWBBR8XQKEE9TMipuB
zhccLikenEhjQjAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQD
AwNpADBmAjEAvvNhzwIQHWSVB7gYboiFBS+DCBeQyh+KTOgNG3qxrdWBCUfvO6wIBHxcmbHt
RwfSAjEAnbpV/KlK6O3t5nYBQnvI+GDZjVGLVTv7jHvrZQnD+JbNR6iC8hZVdyR+EhCVBCyj
-----END CERTIFICATE-----`;

assert.deepEqual(distrustedRoots([EMSIGN_ECC_ROOT_G3]), ["emSign ECC Root CA - G3"]);
assert.match(untrustedRuntime("https://ephemeris.cascade.industries/api/mcp", [EMSIGN_ECC_ROOT_G3]), /Nothing was sent/);
assert.equal(untrustedRuntime("https://ephemeris.cascade.industries/api/mcp", []), null);
assert.equal(untrustedRuntime("http://127.0.0.1:1/api/mcp", [EMSIGN_ECC_ROOT_G3]), null);
assert.equal(untrustedRuntime("https://ephemeris.cascade.industries/api/mcp"), null, `Node ${process.version} trusts compromised eMudhra roots`);
console.log("trust: ok");
