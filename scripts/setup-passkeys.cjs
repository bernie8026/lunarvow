'use strict';
// One-time migration from the password-derived v2 archive. Use only a local
// private password file; the new archive receives a fresh random content key.
const fs = require('node:fs');
const path = require('node:path');
const {archiveConfig,buildVault,recover,readPassword,readPasskeyAccess,LEGACY_FORMAT} = require('./build-vault.cjs');
const root = path.resolve(__dirname,'..');

function setup() {
  const config = archiveConfig(root);
  if (config.format !== LEGACY_FORMAT) throw new Error('Migration requires a legacy v2 archive. For a content update, build from private source.');
  const access = readPasskeyAccess();
  const staging = fs.mkdtempSync(path.join(root,'.encrypted-build-'));
  try {
    const source = path.join(staging,'source');
    const recovered = recover({encryptedRoot:root,password:readPassword(),output:source});
    const built = buildVault({root:source,access,output:path.join(root,'.encrypted-dist')});
    if (built.count !== recovered) throw new Error('Archive file count changed during migration.');
    console.log(`Migrated ${built.count} source files to a new passkey archive in .encrypted-dist/.`);
  } finally { fs.rmSync(staging,{recursive:true,force:true}); }
}

if (require.main===module) {
  try { setup(); }
  catch { console.error('Migration failed. Check the private legacy password, passkey configuration and v2 archive.'); process.exitCode=1; }
}
module.exports = {setup};
