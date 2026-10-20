const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'_vault/config.json'),'utf8'));
assert.equal(config.format,'lunarvow-vault-v2');assert.equal(config.compression,'gzip');assert.equal(config.iterations,600000);
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of tracked){
  assert(!/^(?:\.private\/|\.encrypted-dist\/|assets\/|data\/|source\/)/.test(file),`Plaintext or private file tracked: ${file}`);
  assert(!/(?:access-password|\.env(?:\.|$))/.test(file),`Secret file tracked: ${file}`);
}
assert(!fs.existsSync(path.join(root,'site.js')));assert(!fs.existsSync(path.join(root,'style.css')));
const pages=['index.html','guide.html','lunar-vow-guide.html','hi3.html','gallery.html','story.html','captain-line.html','honkai-info.html','news.html','404.html'];
for(const page of pages){const html=fs.readFileSync(path.join(root,page),'utf8');assert(html.includes('data-vault-gate'));assert(!html.includes('data-vault-content'));assert(!html.includes('@@ROOT@@'));}
const data=fs.readdirSync(path.join(root,'_vault/data'));assert.deepEqual(data,[config.archive.file]);
assert(fs.statSync(path.join(root,'_vault/data',config.archive.file)).size>16);
assert(fs.existsSync(path.join(root,'.nojekyll')));
console.log('PASS encrypted publication: nine routes and 404 are gates; only ciphertext contains the original source and assets');
