const test = require('node:test');
const assert = require('node:assert/strict');
const { assertSecureRuntime } = require('../cli/secure-runtime');

test('requires a patched supported Node release before authenticated requests', () => {
  for (const version of ['20.19.0', '22.23.3', '24.22.0', '26.12.0', '24.22.1-rc.0', '27.0.0']) assert.throws(() => assertSecureRuntime(version));
  for (const version of ['22.23.4', '24.22.1', '24.23.0', '26.12.1']) assert.doesNotThrow(() => assertSecureRuntime(version));
});
