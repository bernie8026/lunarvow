const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {buildVault,readArchive,recover}=require('../scripts/build-vault.cjs');
const {unwrapBridge}=require('../scripts/passkey-bridge.cjs');
const PASSWORD='fixture-only-not-a-production-password';
function testAccess() {
  return {archiveId:crypto.randomUUID(),archiveKeyB64:crypto.randomBytes(32).toString('base64'),authOrigin:'https://fixture.workers.dev'};
}
function fixture() {
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'lunar-public-vault-')));
  const files={
    'index.html':'<!doctype html><html lang="zh-HK"><head><title>PRIVATE FIXTURE</title></head><body><main id="main-content">PRIVATE_LUNAR_CONTENT</main><script src="site.js" defer></script></body></html>',
    'guide.html':'<!doctype html><html lang="zh-HK"><head><title>PRIVATE GUIDE</title></head><body><main id="main-content">PRIVATE_GUIDE_CONTENT</main><script src="site.js" defer></script></body></html>',
    'site.js':'window.BHR_I18N={language:"zh-HK"}; window.PRIVATE_CODE="private";',
    'style.css':'body{background:#110c14}',
    'data/characters.json':'[{"private":"character"}]',
    'assets/photo.svg':'<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><path fill="red" d="M0 0H3V2H0Z"/></svg>',
    'assets/audio.mp3':Buffer.from('PRIVATE_AUDIO_FIXTURE_CONTENT'),
    'source-notes.md':'PRIVATE_NON_RUNTIME_SOURCE_BACKUP',
    '.github/workflows/old.yml':'name: ORIGINAL_WORKFLOW_BACKUP\n'
  };
  for(const [name,body] of Object.entries(files)){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);}
  fs.writeFileSync(path.join(root,'assets/preload-manifest.json'),JSON.stringify({resources:Object.keys(files).filter(n=>!n.startsWith('.')&&!n.endsWith('.md')).map(url=>({url,type:'fetch'}))}));
  return {root,files};
}
function inspect(output,access) {
  return {config:JSON.parse(fs.readFileSync(path.join(output,'_vault/config.json'),'utf8')),index:readArchive(output,{access})};
}
function legacyFixture(root) {
  const body=Buffer.from('Synthetic legacy archive');
  const format='lunarvow-vault-v2',build='a'.repeat(32),file='b'.repeat(48)+'.bin',iterations=600000;
  const salt=crypto.randomBytes(32),iv=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(PASSWORD,salt,iterations,32,'sha256');
  const config={format,build,compression:'gzip',iterations,salt:salt.toString('base64'),archive:{file,iv:iv.toString('base64')}};
  const packed=zlib.gzipSync(JSON.stringify({format,build,files:{'index.html':{body:body.toString('base64'),bytes:body.length,type:'text/html'}}}));
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from(`${format}:${build}:@archive`));
  const ciphertext=Buffer.concat([cipher.update(packed),cipher.final(),cipher.getAuthTag()]);
  key.fill(0);
  fs.mkdirSync(path.join(root,'_vault/data'),{recursive:true});
  fs.writeFileSync(path.join(root,'_vault/config.json'),JSON.stringify(config));
  fs.writeFileSync(path.join(root,'_vault/data',file),ciphertext);
  return body;
}
function run() {
  const {root,files}=fixture(),output=path.join(root,'.encrypted-dist'),restore=path.join(root,'.private/recovered'),access=testAccess();
  try {
    assert.throws(()=>buildVault({root,output,password:PASSWORD}),/passkey|access/i);
    assert.throws(()=>buildVault({root,output,access,basePath:'/../'}),/absolute directory/);
    assert.throws(()=>buildVault({root,output:root,access}),/must not replace/);
    assert(!fs.existsSync(output));
    const first=buildVault({root,output,access});
    const {config,index}=inspect(output,access);
    assert.equal(config.format,'lunarvow-vault-v3');assert.equal(config.compression,'gzip');
    assert(!Object.hasOwn(config,'salt'));assert(!Object.hasOwn(config,'iterations'));
    assert.equal(Buffer.from(config.archive.iv,'base64').length,12);
    assert(!JSON.stringify(config).includes(access.archiveKeyB64));
    assert.equal(first.count,Object.keys(files).length+1);
    for(const [name,body] of Object.entries(files)){
      assert.deepEqual(Buffer.from(index.files[name].body,'base64'),Buffer.from(body));
      if(name.endsWith('.html')){const gate=fs.readFileSync(path.join(output,name),'utf8');assert(gate.includes('data-vault-gate'));assert(!gate.includes('PRIVATE_LUNAR_CONTENT'));}
      else assert(!fs.existsSync(path.join(output,name)),`${name} must not be published as plaintext`);
    }
    assert.throws(()=>readArchive(output,{password:PASSWORD}),/passkey|access/i);
    assert.throws(()=>inspect(output,{...access,archiveKeyB64:testAccess().archiveKeyB64}));
    const payload=path.join(output,'_vault/data',config.archive.file),ciphertext=fs.readFileSync(payload);ciphertext[0]^=1;fs.writeFileSync(payload,ciphertext);
    assert.throws(()=>inspect(output,access),/authenticate/);
    const second=buildVault({root,output,access});
    const firstKey=unwrapBridge(config,access),secondKey=unwrapBridge(second.config,access);
    assert.notDeepEqual(firstKey,secondKey);firstKey.fill(0);secondKey.fill(0);
    assert.notEqual(second.config.archive.iv,config.archive.iv);
    const backupCount=recover({encryptedRoot:output,access,output:restore});assert.equal(backupCount,first.count);
    for(const [name,body] of Object.entries(files))assert.deepEqual(fs.readFileSync(path.join(restore,name)),Buffer.from(body));
    assert.throws(()=>recover({encryptedRoot:output,access,output:restore}),/new, empty destination/);
    const legacy=path.join(root,'.private/legacy'),legacyBody=legacyFixture(legacy);
    assert.throws(()=>readArchive(legacy,{password:'incorrect-long-fixture-password'}),/authenticate/);
    assert.equal(recover({encryptedRoot:legacy,password:PASSWORD,output:path.join(root,'.private/legacy-restored')}),1);
    assert.deepEqual(fs.readFileSync(path.join(root,'.private/legacy-restored/index.html')),legacyBody);
    const manifestPath=path.join(root,'assets/preload-manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
    manifest.resources.push({url:'missing.webp'});fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    assert.throws(()=>buildVault({root,output,access}),/Missing protected resource/);
    assert.equal(inspect(output,access).config.build,second.config.build);
    manifest.resources.pop();fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    fs.symlinkSync(path.join(root,'site.js'),path.join(root,'assets/link.js'));
    assert.throws(()=>buildVault({root,output,access}),/Symlinks/);
    console.log('PASS vault: password-only and wrong key rejected, tampering rejected, fresh keys/IVs, offline recovery of v2 and v3, no plaintext publication and atomic failures');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
}
if(require.main===module)run();
module.exports={fixture,inspect,PASSWORD,run,testAccess};
