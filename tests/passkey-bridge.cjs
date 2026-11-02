'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createBridge,AAD}=require('../scripts/passkey-bridge.cjs');
const config={build:crypto.randomBytes(16).toString('hex'),salt:crypto.randomBytes(32).toString('base64'),iterations:600000};
const password=crypto.randomBytes(32).toString('base64url'),key=crypto.randomBytes(32);
const access={archiveId:crypto.randomUUID(),archiveKeyB64:key.toString('base64'),authOrigin:'https://fixture.workers.dev',adminToken:'private-owner-token'};
const bridge=createBridge(config,password,access);
function unwrap(rootKey=key,basePath='/lunarvow/',wrapped=Buffer.from(bridge.wrappedKey,'base64')){
 const decipher=crypto.createDecipheriv('aes-256-gcm',rootKey,Buffer.from(bridge.iv,'base64'));
 decipher.setAAD(Buffer.from(AAD(config,access.archiveId,basePath)));decipher.setAuthTag(wrapped.subarray(-16));
 return Buffer.concat([decipher.update(wrapped.subarray(0,-16)),decipher.final()]);
}
const expected=crypto.pbkdf2Sync(password,Buffer.from(config.salt,'base64'),600000,32,'sha256');
assert.deepEqual(unwrap(),expected);
assert.throws(()=>unwrap(crypto.randomBytes(32)));assert.throws(()=>unwrap(key,'/other/'));
const corrupt=Buffer.from(bridge.wrappedKey,'base64');corrupt[0]^=1;assert.throws(()=>unwrap(key,'/lunarvow/',corrupt));
assert.notEqual(createBridge(config,password,access).wrappedKey,bridge.wrappedKey);
for(const secret of [password,expected.toString('base64'),access.archiveKeyB64,access.adminToken])assert(!JSON.stringify(bridge).includes(secret));
assert.throws(()=>createBridge(config,password,{...access,authOrigin:'http://fixture.workers.dev'}));
expected.fill(0);key.fill(0);
console.log('PASS passkey bridge: authenticated unwrap, wrong key, wrong site, tampering, independent IVs and no public credentials');
