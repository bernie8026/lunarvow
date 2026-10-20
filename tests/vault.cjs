const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { buildVault } = require('../scripts/build-vault.cjs');
const { inspect, PASSWORD, run } = require('./vault-unit.cjs');
const root = path.resolve(__dirname, '..');
const basePath = '/lunarvow/';
const previews = '/tmp/lunarvow-boot-preview';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

async function ready(page) {
  await page.locator('html[data-vault-content]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-vault-pending'));
  await page.locator('.boot-screen').waitFor({ state: 'hidden', timeout: 35000 });
}
async function gate(page) {
  await page.locator('html[data-vault-gate]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => !document.querySelector('[data-vault-submit]')?.disabled);
}
async function unlock(page) {
  await gate(page);
  await page.locator('[data-vault-password]').fill(PASSWORD);
  await page.locator('[data-vault-submit]').click();
  await ready(page);
}

(async () => {
  run();
  fs.mkdirSync(previews, { recursive: true });
  const built = buildVault({ password: PASSWORD });
  const { index } = inspect(built.output);
  const requests = [];
  let damaged = null;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push(url.pathname + url.search);
    let name;
    try { name = decodeURIComponent(url.pathname.slice(basePath.length)) || 'index.html'; }
    catch { res.writeHead(400); res.end(); return; }
    const file = path.resolve(built.output, name);
    if (!url.pathname.startsWith(basePath) || !file.startsWith(built.output + path.sep)) { res.writeHead(404); res.end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
      if (name === damaged) { bytes = Buffer.from(bytes); bytes[0] ^= 1; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${basePath}`;
  let browser;
  try {
    // Direct HTTP requests never see the unencrypted source, even without a service worker.
    for (const name of Object.keys(index.files)) {
      const response = await fetch(base + name.split('/').map(encodeURIComponent).join('/'));
      if (name.endsWith('.html')) {
        assert.equal(response.status, 200);
        const html = await response.text(); assert(html.includes('data-vault-gate')); assert(!html.includes('data-vault-content'));
      } else assert.equal(response.status, 404, `Plaintext path leaked: ${name}`);
    }
    console.log(`PASS vault raw HTTP: ${built.count} original paths serve gates or no file`);
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + 'lunar-vow-guide.html');
    await gate(page);
    for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `${previews}/vault-locked-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [language, heading] of [['en', 'An archive under seal'], ['zh-CN', '月下档案已封存'], ['zh-HK', '月下檔案已封存']]) {
      await page.locator(`[data-vault-language="${language}"]`).click();
      assert.equal(await page.locator('h1').textContent(), heading);
    }
    const lockedPaths = ['data/characters.json', 'site.js', 'style.css', 'assets/lunar-collection/crimson-vow-mobile.webp'];
    assert.deepEqual(await page.evaluate(async names => Promise.all(names.map(async name => (await fetch(name)).status)), lockedPaths), [403, 403, 403, 403]);
    await page.locator('[data-vault-password]').fill('incorrect-long-test-password');
    await page.locator('[data-vault-submit]').click();
    await page.waitForFunction(() => document.querySelector('[data-vault-status]').classList.contains('is-error'));
    assert.match(await page.locator('[data-vault-status]').textContent(), /密碼唔正確/);
    assert.equal(await page.locator('[data-vault-password]').inputValue(), '');
    assert.equal(await page.evaluate(async () => (await fetch('data/characters.json')).status), 403);
    console.log('PASS vault gate: three languages, narrow mobile, direct files blocked, wrong password stays locked');

    const started = Date.now();
    await unlock(page);
    assert(Date.now() - started >= 9000, 'The ten-second first arrival is retained after unlocking');
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-HK');
    assert.equal(await page.locator('.vault-session-lock').textContent(), '鎖定檔案');
    await page.screenshot({ path: `${previews}/vault-unlocked-guide-1440.png` });
    const privateState = await page.evaluate(async () => ({
      cacheKeys: await caches.keys(),
      local: JSON.stringify({ ...localStorage }),
      session: JSON.stringify({ ...sessionStorage }),
      json: (await (await fetch('data/characters.json')).json()).length,
      header: (await fetch('site.js')).headers.get('cache-control')
    }));
    assert.deepEqual(privateState.cacheKeys, []);
    assert(!privateState.local.includes(PASSWORD) && !privateState.session.includes(PASSWORD));
    assert(!privateState.local.includes('lunar-vault:'));
    assert.equal(privateState.json, 41);
    assert.equal(privateState.header, 'no-store');
    assert(!requests.some(url => url.includes(PASSWORD) || url.includes('incorrect-long-test-password')));
    for (const file of ['index.html', 'guide.html', 'hi3.html', 'gallery.html', 'story.html', 'captain-line.html', 'honkai-info.html', 'news.html']) {
      await page.goto(base + file, { waitUntil: 'domcontentloaded' });
      await ready(page);
      assert.equal(await page.locator('[data-vault-gate]').count(), 0, file);
      if (file === 'hi3.html') {
        await page.waitForFunction(() => document.querySelectorAll('.card').length === 41);
        await page.locator('#search').fill('月下');
        assert(await page.locator('.card:visible').count() > 0);
      }
    }
    console.log('PASS vault full site: all nine pages, complete real preload, 41 character files, no plaintext storage');

    // Stop only the local test browser worker to exercise real lifecycle recovery.
    const devtools = await context.newCDPSession(page);
    await devtools.send('ServiceWorker.enable');
    await devtools.send('ServiceWorker.stopAllWorkers');
    const recovered = await page.evaluate(async () => (await (await fetch('data/characters.json')).json()).length);
    assert.equal(recovered, 41);
    await devtools.detach();
    const mp3 = Object.keys(index.files).find(name => name.endsWith('.mp3'));
    const ranges = await page.evaluate(async name => {
      const part = await fetch(name + '?v=7', { headers: { Range: 'bytes=17-48' } });
      const suffix = await fetch(name, { headers: { Range: 'bytes=-11' } });
      const invalid = await fetch(name, { headers: { Range: 'bytes=99999999-' } });
      return { status: part.status, size: (await part.arrayBuffer()).byteLength, range: part.headers.get('content-range'), suffix: (await suffix.arrayBuffer()).byteLength, invalid: invalid.status };
    }, mp3);
    assert.equal(ranges.status, 206); assert.equal(ranges.size, 32); assert.match(ranges.range, /^bytes 17-48\//);
    assert.equal(ranges.suffix, 11); assert.equal(ranges.invalid, 416);
    await page.locator('.music-console__toggle').click();
    await page.waitForFunction(() => document.querySelector('.music-console').classList.contains('is-playing'));
    await page.locator('.music-console__toggle').click();
    console.log('PASS vault lifecycle: worker restart restores access; music plays only on click and supports byte ranges');

    const other = await context.newPage();
    await other.goto(base + 'gallery.html'); await ready(other);
    const picture = await context.newPage();
    await picture.goto(base + 'assets/lunar-collection/crimson-vow-mobile.webp');
    await picture.waitForFunction(() => document.querySelector('img')?.naturalWidth > 0);
    await page.locator('.vault-session-lock').click();
    await gate(page); await gate(other); await gate(picture);
    for (const tab of [page, other, picture]) {
      assert.equal(await tab.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('lunar-vault:')).length), 0);
      assert.equal(await tab.evaluate(async () => (await fetch(new URL('data/characters.json', document.querySelector('script[src]').src.replace('_vault/runtime.js', '')))).status), 403);
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS vault logout: all open pages and original-image tabs return to the locked entrance');

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await mobileContext.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
    });
    const mobile = await mobileContext.newPage();
    await mobile.goto(base); await unlock(mobile);
    await mobile.screenshot({ path: `${previews}/vault-unlocked-mobile-390.png` });
    assert(await mobile.locator('.vault-session-lock').isVisible());
    await mobile.locator('.vault-session-lock').click(); await gate(mobile);
    await mobileContext.close();
    console.log('PASS vault storage restriction: memory-only unlock and lock remain usable on mobile');

    const corruptContext = await browser.newContext();
    const corrupt = await corruptContext.newPage();
    await corrupt.goto(base); await gate(corrupt);
    damaged = `_vault/data/${built.config.manifest.file}`;
    await corrupt.locator('[data-vault-password]').fill(PASSWORD);
    await corrupt.locator('[data-vault-submit]').click();
    await corrupt.waitForFunction(() => document.querySelector('[data-vault-status]').classList.contains('is-error'));
    assert.equal(await corrupt.locator('[data-vault-content]').count(), 0);
    damaged = null;
    await corruptContext.close();
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const noJSPage = await noJS.newPage(); await noJSPage.goto(base + 'hi3.html');
    assert.equal(await noJSPage.locator('[data-vault-gate]').count(), 1);
    assert(await noJSPage.locator('noscript').isVisible());
    assert.equal(await noJSPage.locator('[data-vault-content]').count(), 0);
    await noJS.close();
    console.log('PASS vault fail closed: corrupted encrypted index and disabled JavaScript never expose content');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(built.output, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
