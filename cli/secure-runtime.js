function assertSecureRuntime(version = process.versions.node) {
  const [major, minor, patch] = version.split('.').map(Number);
  const minimum = {22: [23, 4], 24: [22, 1], 26: [12, 1]}[major];
  if (![major, minor, patch].every(Number.isInteger) || !minimum || minor < minimum[0] || (minor === minimum[0] && patch < minimum[1]) || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('Update Node.js to 22.23.4+, 24.22.1+ or 26.12.1+ before making authenticated requests (eMudhra CA incident).');
  }
}
module.exports = { assertSecureRuntime };
