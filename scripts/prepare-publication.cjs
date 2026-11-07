const fs=require('node:fs');
const path=require('node:path');
const {FORMAT}=require('./build-vault.cjs');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.encrypted-dist');
const config=JSON.parse(fs.readFileSync(path.join(output,'_vault/config.json'),'utf8'));
if(config.format!==FORMAT || !config.passkeys || 'salt' in config || 'iterations' in config || fs.readFileSync(path.join(output,'.vault-output'),'utf8').trim()!==config.format) throw new Error('A verified encrypted build is required.');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw new Error('Unexpected symlink.');if(entry.isDirectory())walk(file);else files.push(path.relative(output,file));}}
walk(output);
for(const name of files){
  if(name.endsWith('.html')) {
    const gate=fs.readFileSync(path.join(output,name),'utf8');
    if(!gate.includes('data-vault-gate') || /type\s*=\s*['"]password['"]/i.test(gate)) throw new Error('Only the passkey entry pages can be published.');
  }
  if(!name.endsWith('.html')&&!['vault-sw.js','.nojekyll','.vault-output'].includes(name)&&!name.startsWith('_vault'+path.sep))throw new Error('Unexpected public file.');
}
// No live deployment changes until these verified files are committed together.
fs.rmSync(path.join(root,'_vault'),{recursive:true,force:true});
for(const name of files){if(name==='.vault-output')continue;const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(output,name),target);}
console.log('Prepared encrypted root publication. Commit the public output; keep .private/ out of Git.');
