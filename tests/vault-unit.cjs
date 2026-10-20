const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildVault, FORMAT, ITERATIONS } = require('../scripts/build-vault.cjs');
const PASSWORD = 'fixture-only-not-a-production-password';
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-vault-unit-'));
  const files = {
    'index.html': '<!doctype html><html lang="zh-HK"><head><title>Private fixture</title></head><body>PRIVATE_LUNAR_CONTENT</body></html>',
    'detail.html': '<!doctype html><html><head><title>Detail</title></head><body>PRIVATE_DETAIL</body></html>',
    'site.js': 'window.PRIVATE_CODE = "only after unlocking";',
    'style.css': 'body{background:#110c14}',
    'data/private.json': '{"PRIVATE_DATA":"LUNAR_ONLY"}',
    'assets/photo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><path fill="red" d="M0 0H3V2H0Z"/></svg>',
    'assets/audio.mp3': Buffer.from('PRIVATE_AUDIO_FIXTURE')
  };
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), content);
  }
  fs.writeFileSync(path.join(root, 'assets/preload-manifest.json'), JSON.stringify({ resources: Object.keys(files).map(url => ({ url, type: 'fetch' })) }));
  return { root, files };
}
function inspect(output, password = PASSWORD) {
  const config = JSON.parse(fs.readFileSync(path.join(output, '_vault/config.json')));
  const key = crypto.pbkdf2Sync(password.normalize('NFC'), Buffer.from(config.salt, 'base64'), config.iterations, 32, 'sha256');
  const decrypt = (name, record) => {
    const ciphertext = fs.readFileSync(path.join(output, '_vault/data', record.file));
    const cipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv, 'base64'));
    cipher.setAAD(Buffer.from(`${FORMAT}:${config.build}:${name}`));
    cipher.setAuthTag(ciphertext.subarray(-16));
    return Buffer.concat([cipher.update(ciphertext.subarray(0, -16)), cipher.final()]);
  };
  return { config, decrypt, index: JSON.parse(decrypt('@manifest', config.manifest)) };
}
function run() {
  const { root, files } = fixture();
  try {
    assert.throws(() => buildVault({ root }), /16 or more/);
    assert.throws(() => buildVault({ root, password: 'too-short' }), /16 or more/);
    assert.throws(() => buildVault({ root, password: PASSWORD, basePath: '/../' }), /absolute directory/);
    assert(!fs.existsSync(path.join(root, '.encrypted-dist')));
    const first = buildVault({ root, password: PASSWORD });
    const { config, decrypt, index } = inspect(first.output);
    assert.equal(config.iterations, ITERATIONS);
    assert.equal(index.build, config.build);
    assert.equal(first.count, Object.keys(files).length + 1);
    assert.equal(new Set([config.manifest.iv, ...Object.values(index.files).map(record => record.iv)]).size, first.count + 1);
    for (const [name, original] of Object.entries(files)) {
      const content = decrypt(name, index.files[name]);
      if (name.endsWith('.html')) {
        assert(content.toString().includes(String(original).match(/PRIVATE_[A-Z_]+/)[0]));
        assert(content.toString().includes('data-vault-content data-vault-pending'));
        const gate = fs.readFileSync(path.join(first.output, name), 'utf8');
        assert(gate.includes('data-vault-gate'));
        assert(!gate.includes('PRIVATE_LUNAR_CONTENT'));
      } else {
        assert.deepEqual(content, Buffer.from(original));
        assert(!fs.existsSync(path.join(first.output, name)), `${name} must not be deployed in plaintext`);
      }
    }
    assert.throws(() => decrypt('site.js', index.files['data/private.json']), /authenticate/);
    assert.throws(() => inspect(first.output, 'incorrect-password-for-test'), /authenticate/);
    const target = path.join(first.output, '_vault/data', index.files['site.js'].file);
    const damaged = fs.readFileSync(target); damaged[0] ^= 1; fs.writeFileSync(target, damaged);
    assert.throws(() => decrypt('site.js', index.files['site.js']), /authenticate/);
    const second = buildVault({ root, password: PASSWORD });
    assert.notEqual(second.config.salt, config.salt);
    assert.notEqual(second.config.build, config.build);
    const manifestPath = path.join(root, 'assets/preload-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    manifest.resources.push({ url: 'missing.webp' }); fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => buildVault({ root, password: PASSWORD }), /Missing protected resource/);
    assert.equal(inspect(second.output).config.build, second.config.build, 'A failed build must preserve the previous encrypted output');
    manifest.resources.pop(); fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.symlinkSync(path.join(root, 'site.js'), path.join(root, 'assets/link.js'));
    assert.throws(() => buildVault({ root, password: PASSWORD }), /Symlinks/);
    console.log('PASS vault cryptography, opaque filenames, no plaintext assets, tamper rejection, atomic builds');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
if (require.main === module) run();
module.exports = { fixture, inspect, PASSWORD, run };
