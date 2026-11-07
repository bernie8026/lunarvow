'use strict';

// Real Chrome WebAuthn, the shared verifier, and a synthetic encrypted archive.
// Run with an adjacent lunarvow-united Passkey checkout and its Cloudflare
// dependencies installed, or set LUNARVOW_UNITED_CHECKOUT to that directory.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash, randomBytes } = require('node:crypto');
const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { buildVault } = require('../scripts/build-vault.cjs');
const { fixture, testAccess } = require('./vault-unit.cjs');

const united = path.resolve(process.env.LUNARVOW_UNITED_CHECKOUT || path.join(__dirname, '../../lunarvow-united'));
const cloudflare = path.join(united, 'cloudflare');
const { build } = require(path.join(cloudflare, 'node_modules/esbuild'));
const { Miniflare, Log, LogLevel } = require(path.join(cloudflare, 'node_modules/miniflare'));
const siteHost = 'bernie8026.github.io';
const apiHost = 'lunarvow-integration-fixture.workers.dev';
const siteRoot = '/lunarvow/';
const defaultRoot = '/default-archive-fixture/';
const access = { ...testAccess(), authOrigin: `https://${apiHost}` };
const defaultAccess = { ...testAccess(), authOrigin: access.authOrigin };
const admin = randomBytes(32).toString('base64url');
const ipKey = randomBytes(32).toString('base64');
const secrets = [admin, ipKey, access.archiveKeyB64, defaultAccess.archiveKeyB64];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const sha = value => createHash('sha256').update(value).digest('hex');
const events = [];
let root, temp, server, mf, browser, page, siteOrigin, apiOrigin;
let swapArchive = false;

async function invoke(route, { method = 'POST', body, owner = false } = {}) {
  const response = await mf.dispatchFetch(apiOrigin + route, {
    method,
    headers: {
      Origin: siteOrigin,
      'CF-Connecting-IP': '192.0.2.14',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(owner ? { Authorization: `Bearer ${admin}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, value: await response.json() };
}

async function main() {
  ({ root } = fixture());
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-passkey-integration-'));
  const keyFile = path.join(temp, 'tls-key.pem'), certFile = path.join(temp, 'tls-cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyFile, '-out', certFile, '-days', '1', '-subj', `/CN=${siteHost}`], { stdio: 'ignore' });
  fs.chmodSync(keyFile, 0o600);
  const dist = path.join(temp, 'dist'), defaultDist = path.join(temp, 'default-dist');
  server = https.createServer({ key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }, async (req, res) => {
    try {
      const host = (req.headers.host || '').split(':')[0];
      if (host === apiHost) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 65536) { res.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        headers.set('CF-Connecting-IP', '192.0.2.14');
        const route = new URL(req.url, apiOrigin).pathname;
        let body = Buffer.concat(chunks);
        if (swapArchive && req.method === 'POST' && route === '/v1/passkeys/auth/verify') {
          swapArchive = false;
          body = Buffer.from(JSON.stringify({ ...JSON.parse(body), archiveId: defaultAccess.archiveId }));
        }
        const result = await mf.dispatchFetch(apiOrigin + req.url, {
          method: req.method, headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body } : {}),
        });
        events.push([req.method, route, result.status]);
        res.writeHead(result.status, Object.fromEntries(result.headers)).end(Buffer.from(await result.arrayBuffer()));
        return;
      }
      if (host !== siteHost) { res.writeHead(404).end(); return; }
      const pathname = decodeURIComponent(new URL(req.url, siteOrigin).pathname);
      const basePath = [siteRoot, defaultRoot].find(candidate => pathname.startsWith(candidate));
      if (!basePath || pathname.includes('\\') || pathname.split('/').includes('..')) { res.writeHead(404).end(); return; }
      const folder = basePath === siteRoot ? dist : defaultDist;
      const filename = path.resolve(folder, pathname.slice(basePath.length) || 'index.html');
      if (!filename.startsWith(folder + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404).end(); return; }
      const body = fs.readFileSync(filename);
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(503).end();
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  siteOrigin = `https://${siteHost}:${port}`;
  apiOrigin = `${access.authOrigin}:${port}`;
  const base = siteOrigin + siteRoot;
  const { config } = buildVault({ root, output: dist, access: { ...access, authOrigin: apiOrigin } });
  buildVault({ root, output: defaultDist, basePath: defaultRoot, access: { ...defaultAccess, authOrigin: apiOrigin } });
  assert(!('salt' in config) && !('iterations' in config));
  const bundled = await build({ entryPoints: [path.join(cloudflare, 'auth-worker.mjs')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', external: ['cloudflare:workers'], write: false, logLevel: 'silent' });
  const worker = bundled.outputFiles[0].text;
  const productionOrigin = `https://${siteHost}`;
  assert(worker.includes(productionOrigin));
  mf = new Miniflare({
    name: 'lunarvow-archive-passkey-integration', modules: true, script: worker.replaceAll(productionOrigin, siteOrigin),
    compatibilityDate: '2026-07-30',
    durableObjects: { IP_GUARD: { className: 'IpAttemptGuard', useSQLite: true }, PASSKEYS: { className: 'PasskeyRegistry', useSQLite: true } },
    bindings: {
      SITE_ORIGIN: siteOrigin, ARCHIVE_ID: defaultAccess.archiveId, ARCHIVE_KEY_B64: defaultAccess.archiveKeyB64,
      LUNAR_VAULT_ARCHIVE_ID: access.archiveId, LUNAR_VAULT_KEY_B64: access.archiveKeyB64,
      IP_HMAC_KEY_B64: ipKey, ADMIN_TOKEN_SHA256: sha(admin),
    },
    log: new Log(LogLevel.NONE),
  });
  await mf.ready;
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true,
    args: ['--no-proxy-server', '--ignore-certificate-errors', `--host-resolver-rules=MAP ${siteHost} 127.0.0.1,MAP ${apiHost} 127.0.0.1,MAP * ~NOTFOUND`],
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', () => pageErrors.push('uncaught browser error'));
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable', { enableUI: false });
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
    protocol: 'ctap2', ctap2Version: 'ctap2_1', transport: 'internal', hasResidentKey: true, hasUserVerification: true,
    isUserVerified: true, automaticPresenceSimulation: true,
  } });

  const button = page.locator('[data-vault-passkey]');
  const status = page.locator('[data-vault-status]');
  const privateContent = page.locator('[data-vault-content] #main-content');
  await page.goto(base);
  await page.locator('[data-vault-passkey]:enabled').waitFor();
  assert.equal(await page.locator('input[type=password]').count(), 0);
  assert.equal((await page.evaluate(async () => (await fetch('data/characters.json')).status)), 403);
  assert.equal(events.length, 0, 'opening the gate does not request a WebAuthn challenge');
  const retired = await invoke('/v1/unlock', { body: { archiveId: access.archiveId, password: 'synthetic-retired-password' } });
  assert.equal(retired.status, 410);
  assert.deepEqual(retired.value, { ok: false, code: 'passkey_required' });
  console.log('PASS locked archive and retired password path');

  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-vault-status]').textContent.includes('未登記通行密鑰'));
  assert.equal(await privateContent.count(), 0);
  const invitation = await invoke('/v1/admin/passkeys/invitations', { owner: true, body: {} });
  assert.equal(invitation.status, 200);
  assert.equal(typeof invitation.value.token, 'string');
  secrets.push(invitation.value.token);
  await page.goto(base + 'unlock.html#passkey-setup=' + encodeURIComponent(invitation.value.token));
  await page.locator('[data-vault-passkey-register]').click();
  await page.waitForFunction(() => document.querySelector('[data-vault-status]').textContent.includes('通行密鑰已新增'));
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await privateContent.count(), 0, 'registration alone does not unlock the site');
  const list = await invoke('/v1/admin/passkeys', { method: 'GET', owner: true });
  assert.equal(list.value.credentials.length, 1);
  console.log('PASS owner invitation and authentic WebAuthn registration');

  swapArchive = true;
  await button.click();
  await page.locator('[data-vault-status].is-error').waitFor();
  assert.equal(await privateContent.count(), 0);
  assert.equal(swapArchive, false);
  assert.deepEqual(events.at(-1), ['POST', '/v1/passkeys/auth/verify', 401]);
  console.log('PASS a Lunar challenge cannot release the default archive key');

  await cdp.send('WebAuthn.setResponseOverrideBits', { authenticatorId, isBadUV: true });
  await button.click();
  await page.locator('[data-vault-status].is-error').waitFor();
  assert.equal(await privateContent.count(), 0);
  await cdp.send('WebAuthn.setResponseOverrideBits', { authenticatorId });
  await button.click();
  await privateContent.waitFor();
  assert.match(await privateContent.textContent(), /PRIVATE_LUNAR_CONTENT/);
  assert(events.some(([method, route, code]) => method === 'POST' && route === '/v1/passkeys/auth/verify' && code === 200));
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  assert(!storage.includes(access.archiveKeyB64) && !storage.includes(defaultAccess.archiveKeyB64), 'Worker wrapping keys are not persisted by the client');
  console.log('PASS rejects an unverified assertion and unlocks ciphertext only after a valid assertion');

  await page.locator('.vault-session-lock').click();
  await page.locator('[data-vault-passkey]:enabled').waitFor();
  await page.goto(siteOrigin + defaultRoot);
  await button.click();
  await privateContent.waitFor();
  assert.match(await privateContent.textContent(), /PRIVATE_LUNAR_CONTENT/);
  await page.locator('.vault-session-lock').click();
  await page.locator('[data-vault-passkey]:enabled').waitFor();
  await page.goto(base);
  await page.locator('[data-vault-passkey]:enabled').waitFor();
  console.log('PASS the same registered passkey unlocks the separate default archive');

  const revoked = await invoke('/v1/admin/passkeys/revoke', { owner: true, body: { credentialId: list.value.credentials[0].id } });
  assert.equal(revoked.status, 200);
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-vault-status]').textContent.includes('未登記通行密鑰'));
  assert.equal(await privateContent.count(), 0);
  assert.equal(await status.isVisible(), true);
  assert.deepEqual(pageErrors, []);
  console.log('PASS revoked credential cannot reopen the locked archive');
}

main().catch(error => {
  let message = String(error.stack || error);
  for (const secret of secrets) message = message.replaceAll(secret, '[REDACTED]');
  console.error(message);
  console.error(JSON.stringify({ requests: events }));
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
  await mf?.dispose();
  server?.closeAllConnections();
  if (server) await new Promise(resolve => server.close(resolve));
  if (root) fs.rmSync(root, { recursive: true, force: true });
  if (temp) fs.rmSync(temp, { recursive: true, force: true });
});
