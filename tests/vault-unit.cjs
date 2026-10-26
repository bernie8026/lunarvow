const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {buildVault,readArchive,recover,ITERATIONS}=require('../scripts/build-vault.cjs');
const PASSWORD='fixture-only-not-a-production-password';
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
function inspect(output,password=PASSWORD) {
  return {config:JSON.parse(fs.readFileSync(path.join(output,'_vault/config.json'),'utf8')),index:readArchive(output,password)};
}
function run() {
  const {root,files}=fixture(),output=path.join(root,'.encrypted-dist'),restore=path.join(root,'.private/recovered');
  try {
    assert.throws(()=>buildVault({root,output}),/16 characters/);
    assert.throws(()=>buildVault({root,output,password:'short'}),/16 characters/);
    assert.throws(()=>buildVault({root,output,password:PASSWORD,basePath:'/../'}),/absolute directory/);
    assert.throws(()=>buildVault({root,output:root,password:PASSWORD}),/must not replace/);
    assert(!fs.existsSync(output));
    const first=buildVault({root,output,password:PASSWORD});
    const {config,index}=inspect(output);
    assert.equal(config.iterations,ITERATIONS); assert.equal(config.compression,'gzip');
    assert.equal(Buffer.from(config.salt,'base64').length,32); assert.equal(Buffer.from(config.archive.iv,'base64').length,12);
    assert.equal(first.count,Object.keys(files).length+1);
    for(const [name,body] of Object.entries(files)){
      assert.deepEqual(Buffer.from(index.files[name].body,'base64'),Buffer.from(body));
      if(name.endsWith('.html')){const gate=fs.readFileSync(path.join(output,name),'utf8');assert(gate.includes('data-vault-gate'));assert(!gate.includes('PRIVATE_LUNAR_CONTENT'));}
      else assert(!fs.existsSync(path.join(output,name)),`${name} must not be published as plaintext`);
    }
    assert.throws(()=>inspect(output,'incorrect-long-fixture-password'),/authenticate/);
    const payload=path.join(output,'_vault/data',config.archive.file),ciphertext=fs.readFileSync(payload);ciphertext[0]^=1;fs.writeFileSync(payload,ciphertext);
    assert.throws(()=>inspect(output),/authenticate/);
    const second=buildVault({root,output,password:PASSWORD});
    assert.notEqual(second.config.salt,config.salt); assert.notEqual(second.config.archive.iv,config.archive.iv);
    const backupCount=recover({encryptedRoot:output,password:PASSWORD,output:restore});assert.equal(backupCount,first.count);
    for(const [name,body] of Object.entries(files))assert.deepEqual(fs.readFileSync(path.join(restore,name)),Buffer.from(body));
    assert.throws(()=>recover({encryptedRoot:output,password:PASSWORD,output:restore}),/new, empty destination/);
    const manifestPath=path.join(root,'assets/preload-manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
    manifest.resources.push({url:'missing.webp'});fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    assert.throws(()=>buildVault({root,output,password:PASSWORD}),/Missing protected resource/);
    assert.equal(inspect(output).config.build,second.config.build);
    manifest.resources.pop();fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    fs.symlinkSync(path.join(root,'site.js'),path.join(root,'assets/link.js'));
    assert.throws(()=>buildVault({root,output,password:PASSWORD}),/Symlinks/);
    console.log('PASS vault: wrong passwords, tampering, independent salt/IV, original source recovery, no plaintext publication and atomic failures');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
}
if(require.main===module)run();
module.exports={fixture,inspect,PASSWORD,run};
