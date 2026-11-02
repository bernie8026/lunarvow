'use strict';
const crypto=require('node:crypto');
const AAD=(config,archiveId,basePath)=>`lunarvow-passkey-bridge-v1:${config.build}:${archiveId}:${basePath}`;
function createBridge(config,password,access,basePath='/lunarvow/') {
  const origin=new URL(access.authOrigin);
  if(origin.protocol!=='https:'||origin.origin!==access.authOrigin||!origin.hostname.endsWith('.workers.dev')||typeof access.archiveId!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(access.archiveKeyB64||''))throw Error('Invalid private passkey configuration');
  const key=crypto.pbkdf2Sync(password.normalize('NFC'),Buffer.from(config.salt,'base64'),config.iterations,32,'sha256');
  const wrappingKey=Buffer.from(access.archiveKeyB64,'base64'),iv=crypto.randomBytes(12);
  try {
    const cipher=crypto.createCipheriv('aes-256-gcm',wrappingKey,iv);cipher.setAAD(Buffer.from(AAD(config,access.archiveId,basePath)));
    const wrapped=Buffer.concat([cipher.update(key),cipher.final(),cipher.getAuthTag()]);
    return {version:1,authOrigin:access.authOrigin,archiveId:access.archiveId,iv:iv.toString('base64'),wrappedKey:wrapped.toString('base64')};
  }finally{key.fill(0);wrappingKey.fill(0);}
}
module.exports={createBridge,AAD};
