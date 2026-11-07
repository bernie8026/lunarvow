'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createBridge, unwrapBridge } = require('../scripts/passkey-bridge.cjs');

const config = { build: crypto.randomBytes(16).toString('hex') };
const archiveKey = crypto.randomBytes(32);
const access = {
  archiveId: crypto.randomUUID(),
  archiveKeyB64: crypto.randomBytes(32).toString('base64'),
  authOrigin: 'https://fixture.workers.dev',
  adminToken: 'private-owner-token',
};
const bridge = createBridge(config, archiveKey, access);
const publication = { ...config, passkeys: bridge };

assert.deepEqual(unwrapBridge(publication, access), archiveKey);
assert.throws(() => unwrapBridge(publication, { ...access, archiveKeyB64: crypto.randomBytes(32).toString('base64') }));
assert.throws(() => unwrapBridge(publication, { ...access, archiveId: crypto.randomUUID() }));
assert.throws(() => unwrapBridge(publication, access, '/other/'));
assert.throws(() => unwrapBridge({ ...publication, build: crypto.randomBytes(16).toString('hex') }, access));

const corrupt = Buffer.from(bridge.wrappedKey, 'base64');
corrupt[0] ^= 1;
assert.throws(() => unwrapBridge({ ...config, passkeys: { ...bridge, wrappedKey: corrupt.toString('base64') } }, access));
assert.notEqual(createBridge(config, archiveKey, access).iv, bridge.iv);
assert.throws(() => createBridge(config, archiveKey, { ...access, authOrigin: 'http://fixture.workers.dev' }));
assert.throws(() => createBridge(config, Buffer.alloc(31), access));

for (const secret of [archiveKey.toString('base64'), access.archiveKeyB64, access.adminToken]) {
  assert(!JSON.stringify(publication).includes(secret));
}
archiveKey.fill(0);
console.log('PASS passkey bridge: authenticated unwrap, wrong key and archive, wrong site or build, tampering, independent IVs and no public credentials');
