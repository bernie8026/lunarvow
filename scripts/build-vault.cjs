const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const FORMAT = 'lunarvow-vault-v2';
const ITERATIONS = 600000;
const project = path.resolve(__dirname, '..');
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.avif':'image/avif', '.gif':'image/gif', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.webm':'audio/webm', '.woff':'font/woff', '.woff2':'font/woff2', '.md':'text/plain; charset=utf-8', '.txt':'text/plain; charset=utf-8' };
function validPassword(password) {
  if (typeof password !== 'string' || [...password.normalize('NFC')].length < 16 || Buffer.byteLength(password) > 1024) {
    throw new Error('A private password with at least 16 characters is required.');
  }
}
function readPassword() {
  if (process.env.LUNAR_VAULT_PASSWORD) return process.env.LUNAR_VAULT_PASSWORD;
  const file = process.env.LUNAR_VAULT_PASSWORD_FILE || path.join(project, '.private/access-password.txt');
  return fs.readFileSync(file, 'utf8').replace(/\r?\n$/, '');
}
function collect(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
      if (['.git','.private','.encrypted-dist','node_modules','test-results'].includes(entry.name) || entry.name.startsWith('.encrypted-build-')) continue;
      if (/^\.env(?:\.|$)/.test(entry.name)) throw new Error('Secret environment files must not be included in the source archive.');
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlinks cannot be included in an encrypted build.');
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files.push(path.relative(root,file).split(path.sep).join('/'));
    }
  }
  walk(root);
  const names = new Set(files);
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'assets/preload-manifest.json'),'utf8'));
  if (!Array.isArray(manifest.resources) || !manifest.resources.length) throw new Error('A complete preload manifest is required.');
  for (const resource of manifest.resources) {
    const url = new URL(resource.url,'https://vault.invalid/');
    if (url.origin !== 'https://vault.invalid') throw new Error('External resources must be stored locally before encryption.');
    const name = decodeURIComponent(url.pathname.slice(1));
    if (!names.has(name)) throw new Error(`Missing protected resource: ${name}`);
  }
  if (!names.has('index.html') || fs.readFileSync(path.join(root,'index.html'),'utf8').includes('data-vault-gate')) throw new Error('Editable original source is required, not an already encrypted publication.');
  return {files:files.sort(),pages:[...new Set(manifest.resources.map(r=>r.url.split('?')[0]).filter(n=>n.endsWith('.html')))]};
}
function buildVault({root=path.join(project,'.private/source'),password,basePath='/lunarvow/',output=path.join(project,'.encrypted-dist')}={}) {
  validPassword(password);
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new Error('VAULT_BASE_PATH must be an absolute directory path.');
  root = fs.realpathSync(root); output = path.resolve(output);
  if (output === root || root.startsWith(output+path.sep)) throw new Error('Output must not replace its editable source.');
  if (fs.existsSync(output) && (fs.lstatSync(output).isSymbolicLink() || !fs.existsSync(path.join(output,'.vault-output')))) throw new Error('Refusing to replace output without the vault build marker.');
  const source = collect(root);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  const staging = fs.mkdtempSync(path.join(path.dirname(output),'.encrypted-build-'));
  const build = crypto.randomBytes(16).toString('hex'), salt = crypto.randomBytes(32), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password.normalize('NFC'),salt,ITERATIONS,32,'sha256');
  const write = (name,value) => { const file=path.join(staging,name); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,value); };
  try {
    const files = Object.create(null);
    for (const name of source.files) {
      const body = fs.readFileSync(path.join(root,name));
      files[name] = {body:body.toString('base64'),type:TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream',bytes:body.length};
    }
    const compressed = zlib.gzipSync(Buffer.from(JSON.stringify({format:FORMAT,build,files})),{level:9});
    const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);
    cipher.setAAD(Buffer.from(`${FORMAT}:${build}:@archive`));
    const ciphertext = Buffer.concat([cipher.update(compressed),cipher.final(),cipher.getAuthTag()]);
    const file = `${crypto.randomBytes(24).toString('hex')}.bin`;
    write(`_vault/data/${file}`,ciphertext);
    const config = {format:FORMAT,build,compression:'gzip',iterations:ITERATIONS,salt:salt.toString('base64'),archive:{file,iv:iv.toString('base64')}};
    const template = name => fs.readFileSync(path.join(__dirname,'vault',name),'utf8').replaceAll('@@ROOT@@',basePath).replaceAll('@@BUILD@@',build);
    const gate = template('gate.html');
    for (const name of source.pages) write(name,gate);
    write('404.html',gate);
    write('_vault/config.json',JSON.stringify(config)+'\n');
    for (const name of ['gate.css','session.css','runtime.js']) write(`_vault/${name}`,template(name));
    write('vault-sw.js',template('sw.js'));
    write('.nojekyll',''); write('.vault-output',FORMAT+'\n');
    fs.rmSync(output,{recursive:true,force:true}); fs.renameSync(staging,output);
    return {output,count:source.files.length,pages:source.pages,config};
  } finally {key.fill(0); fs.rmSync(staging,{recursive:true,force:true});}
}
function readArchive(encryptedRoot,password) {
  validPassword(password);
  const config = JSON.parse(fs.readFileSync(path.join(encryptedRoot,'_vault/config.json'),'utf8'));
  if (config.format!==FORMAT || config.compression!=='gzip' || config.iterations!==ITERATIONS || !/^[a-f0-9]{48}\.bin$/.test(config.archive?.file)) throw new Error('Invalid archive format.');
  const salt=Buffer.from(config.salt,'base64'),iv=Buffer.from(config.archive.iv,'base64');
  if (salt.length!==32 || iv.length!==12) throw new Error('Invalid cryptographic parameters.');
  const key=crypto.pbkdf2Sync(password.normalize('NFC'),salt,ITERATIONS,32,'sha256');
  try {
    const ciphertext=fs.readFileSync(path.join(encryptedRoot,'_vault/data',config.archive.file));
    const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
    decipher.setAAD(Buffer.from(`${FORMAT}:${config.build}:@archive`)); decipher.setAuthTag(ciphertext.subarray(-16));
    const compressed=Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()]);
    const index=JSON.parse(zlib.gunzipSync(compressed,{maxOutputLength:150*1024*1024}));
    if (index.format!==FORMAT || index.build!==config.build || !index.files?.['index.html']) throw new Error('Invalid authenticated archive.');
    return index;
  } finally {key.fill(0);}
}
function recover({encryptedRoot=project,password,output=path.join(project,'.private/source')}={}) {
  const index=readArchive(encryptedRoot,password); output=path.resolve(output);
  if (fs.existsSync(output)) throw new Error('Recovery requires a new, empty destination. Existing editable source will not be overwritten.');
  const records=Object.entries(index.files);
  for (const [name,record] of records) {
    if (!name || name.includes('\\') || name.split('/').some(p=>!p || p==='.' || p==='..') || path.isAbsolute(name) || typeof record.body!=='string') throw new Error('Unsafe archive path.');
    if (Buffer.from(record.body,'base64').length!==record.bytes) throw new Error('Invalid source file size.');
  }
  fs.mkdirSync(path.dirname(output),{recursive:true});
  const staging=fs.mkdtempSync(path.join(path.dirname(output),'.encrypted-build-'));
  try {
    for (const [name,record] of records) {const target=path.join(staging,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(record.body,'base64'));}
    fs.renameSync(staging,output); return records.length;
  } finally {fs.rmSync(staging,{recursive:true,force:true});}
}
if (require.main===module) {
  try {
    const password=readPassword();
    if (process.argv.includes('--recover')) console.log(`Recovered ${recover({password})} original source files into .private/source/.`);
    else {const result=buildVault({password,basePath:process.env.VAULT_BASE_PATH||'/lunarvow/'});console.log(`Encrypted ${result.count} source files. Publish only the verified .encrypted-dist/ output.`);}
  } catch(error) {console.error(error.code==='ENOENT'?'Private password or editable source is missing. See README.md.':error.message);process.exitCode=1;}
}
module.exports={buildVault,readArchive,recover,readPassword,FORMAT,ITERATIONS};
