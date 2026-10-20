const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const FORMAT = 'lunarvow-vault-v1';
const ITERATIONS = 600000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg',
  '.webm': 'audio/webm', '.woff': 'font/woff', '.woff2': 'font/woff2' };

function sourceFiles(root) {
  const files = new Set();
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'tests', 'scripts'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlinks cannot be included in an encrypted build.');
      if (entry.isDirectory()) walk(file);
      else if (TYPES[path.extname(file).toLowerCase()] && !['package.json', 'package-lock.json'].includes(entry.name)) {
        files.add(path.relative(root, file).split(path.sep).join('/'));
      }
    }
  }
  walk(root);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/preload-manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.resources) || !manifest.resources.length) throw new Error('A complete preload manifest is required.');
  for (const resource of manifest.resources) {
    const url = new URL(resource.url, 'https://vault.invalid/');
    if (url.origin !== 'https://vault.invalid') throw new Error('External resources must be stored locally before encryption.');
    const name = decodeURIComponent(url.pathname.slice(1));
    if (!files.has(name)) throw new Error(`Missing protected resource: ${name}`);
  }
  if (!files.has('index.html')) throw new Error('index.html is required.');
  return [...files].sort();
}

function buildVault({ root = path.resolve(__dirname, '..'), password, basePath = '/lunarvow/' } = {}) {
  if (typeof password !== 'string' || [...password.normalize('NFC')].length < 16 || Buffer.byteLength(password) > 1024) {
    throw new Error('LUNAR_VAULT_PASSWORD must contain 16 or more characters (maximum 1024 bytes). Set it privately as an Actions secret.');
  }
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new Error('VAULT_BASE_PATH must be an absolute directory path, such as /lunarvow/.');
  root = fs.realpathSync(root);
  const output = path.join(root, '.encrypted-dist');
  if (fs.existsSync(output) && (fs.lstatSync(output).isSymbolicLink() || !fs.existsSync(path.join(output, '.vault-output')))) {
    throw new Error('Refusing to replace an output directory without the vault build marker.');
  }
  const files = sourceFiles(root);
  const staging = fs.mkdtempSync(path.join(root, '.encrypted-build-'));
  const templates = path.join(__dirname, 'vault');
  const build = crypto.randomBytes(16).toString('hex');
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password.normalize('NFC'), salt, ITERATIONS, 32, 'sha256');
  const config = { format: FORMAT, build, iterations: ITERATIONS, salt: salt.toString('base64') };
  const records = Object.create(null);
  const ivs = new Set();
  const write = (name, contents) => {
    const target = path.join(staging, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  };
  const template = name => fs.readFileSync(path.join(templates, name), 'utf8')
    .replaceAll('@@ROOT@@', basePath).replaceAll('@@BUILD@@', build);
  const encrypt = (name, contents) => {
    let iv;
    do { iv = crypto.randomBytes(12); } while (ivs.has(iv.toString('hex')));
    ivs.add(iv.toString('hex'));
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(`${FORMAT}:${build}:${name}`));
    const ciphertext = Buffer.concat([cipher.update(contents), cipher.final(), cipher.getAuthTag()]);
    const file = `${crypto.randomBytes(24).toString('hex')}.bin`;
    write(`_vault/data/${file}`, ciphertext);
    return { file, iv: iv.toString('base64') };
  };
  try {
    const gate = template('gate.html');
    for (const name of files) {
      let contents = fs.readFileSync(path.join(root, name));
      if (name.endsWith('.html')) {
        let html = contents.toString('utf8');
        if (!/<html\b/i.test(html) || !/<head\b[^>]*>/i.test(html)) throw new Error(`Invalid HTML document: ${name}`);
        html = html.replace(/<html\b/i, '<html data-vault-content data-vault-pending');
        html = html.replace(/<head\b[^>]*>/i, match => `${match}\n<link rel="stylesheet" href="${basePath}_vault/session.css">\n<script src="${basePath}_vault/runtime.js" defer></script>`);
        contents = Buffer.from(html);
        write(name, gate);
      }
      records[name] = { ...encrypt(name, contents), type: TYPES[path.extname(name).toLowerCase()], bytes: contents.length };
    }
    config.manifest = encrypt('@manifest', Buffer.from(JSON.stringify({ format: FORMAT, build, files: records })));
    write('_vault/config.json', JSON.stringify(config) + '\n');
    for (const name of ['gate.css', 'session.css', 'runtime.js']) write(`_vault/${name}`, template(name));
    write('vault-sw.js', template('sw.js'));
    write('404.html', gate);
    write('.nojekyll', '');
    write('.vault-output', FORMAT + '\n');
    fs.rmSync(output, { recursive: true, force: true });
    fs.renameSync(staging, output);
    return { output, count: files.length, config };
  } finally {
    key.fill(0);
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    const result = buildVault({ password: process.env.LUNAR_VAULT_PASSWORD, basePath: process.env.VAULT_BASE_PATH || '/lunarvow/' });
    console.log(`Encrypted ${result.count} resources. Publish only .encrypted-dist/.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { buildVault, FORMAT, ITERATIONS };
