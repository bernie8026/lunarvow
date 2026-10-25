const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { buildVault } = require('../scripts/build-vault.cjs');
// The production ciphertext contains these exact pre-encryption source bytes.
// Read the existing public history into an ephemeral local test directory only.
// Never upload plaintext, screenshots, an unlocked archive or production secrets.
const SOURCE = 'b7f17e5e4c5d2f67d6a43fd9cb2dafc27ab81ee0';
const PASSWORD = 'layout-fixture-only-not-the-production-password';
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-layout-'));
  const source = path.join(temp, 'source'); fs.mkdirSync(source);
  const archive = execFileSync('git', ['archive', SOURCE], { maxBuffer:128*1024*1024 });
  execFileSync('tar', ['-x', '-C', source], { input:archive });
  const built = buildVault({ root:source, password:PASSWORD, output:path.join(temp, 'dist') });
  const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json' };
  const server = http.createServer((req,res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/lunarvow/')) { res.writeHead(404).end(); return; }
    const name = decodeURIComponent(url.pathname.slice(10)) || 'index.html';
    const file = path.resolve(built.output, name);
    if (!file.startsWith(built.output + path.sep)) { res.writeHead(404).end(); return; }
    fs.readFile(file,(error,body) => { if(error) res.writeHead(404).end(); else res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}).end(body); });
  });
  let browser;
  try {
    await new Promise(r => server.listen(0,'127.0.0.1',r));
    const base = `http://127.0.0.1:${server.address().port}/lunarvow/`;
    browser = await chromium.launch({headless:true});
    const context = await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    const page = await context.newPage(); page.setDefaultTimeout(90000);
    const errors=[]; page.on('pageerror',error => errors.push(error.message));
    await page.goto(base);
    await page.locator('[data-vault-password]:enabled').fill(PASSWORD);
    await page.locator('[data-vault-submit]').click();
    await page.locator('[data-vault-content]').waitFor({state:'attached'});
    await page.waitForFunction(() => document.readyState==='complete' && window.BHR_I18N && document.querySelector('.boot-screen'));
    await page.locator('.boot-screen').waitFor({state:'detached'});
    await page.waitForFunction(() => document.querySelector('.vault-session-controls .music-console'));
    for (const width of [320,390,768,820,821,930,1180,1280,1366,1440,1920,2560]) {
      await page.setViewportSize({width,height:800});
      for (const language of ['zh-HK','en','zh-CN']) {
        await page.evaluate(l => window.BHR_I18N.setLanguage(l), language);
        await page.waitForTimeout(350);
        await page.evaluate(() => scrollTo(0,0));
        const problems = await page.evaluate(() => {
          const problems=[],rect=s=>document.querySelector(s)?.getBoundingClientRect();
          const overlaps=(a,b)=>a&&b&&a.width&&b.width&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
          if(document.documentElement.scrollWidth>innerWidth+1)problems.push('horizontal overflow');
          const header=rect('.site-header'),nav=rect('.site-nav'),lang=rect('.language-switcher');
          if(innerWidth>820) {
            for(const [name,r] of [['navigation',nav],['language',lang],['brand',rect('.site-brand')]]) {
              if(!r||r.left<0||r.right>innerWidth+1||r.top<header.top-1||r.bottom>header.bottom+1)problems.push(name+' outside header');
            }
            if(overlaps(nav,lang))problems.push('navigation overlaps language');
          }
          if(rect('.hero-copy').top<header.bottom-1)problems.push('hero under header');
          if(overlaps(rect('.hero-copy'),rect('.hero-figure')))problems.push('portrait overlaps copy');
          const title=[...document.querySelectorAll('.hero-copy h1 > span')].map(e=>e.getBoundingClientRect());
          if(overlaps(title[0],title[1]))problems.push('heading lines overlap');
          const dock=rect('.vault-session-controls');
          for(const s of ['.music-console','.vault-session-lock']) {
            const r=rect(s),e=document.querySelector(s);
            if(!r||r.left<dock.left-1||r.right>dock.right+1||r.top<dock.top-1||r.bottom>dock.bottom+1)problems.push(s+' outside controls');
            if(e&&getComputedStyle(e).position==='fixed')problems.push(s+' still floating');
          }
          if(overlaps(rect('.music-console'),rect('.vault-session-lock')))problems.push('music overlaps lock');
          return problems;
        });
        assert.deepEqual(problems,[],`${width}px ${language}`);
      }
      if(width<=820) {
        await page.locator('.menu-toggle').click();
        await page.locator('.language-switcher').waitFor({state:'visible'});
        const fits=await page.locator('.language-switcher').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;});
        assert(fits,`mobile language drawer fits at ${width}px`);
        await page.locator('.menu-toggle').click();
      }
    }
    // Inner pages use the same header and bottom controls after navigation.
    await page.setViewportSize({width:1280,height:800}); await page.goto(base+'guide.html');
    await page.waitForFunction(() => document.readyState==='complete' && window.BHR_I18N && !document.documentElement.hasAttribute('data-vault-pending'));
    await page.locator('.boot-screen').waitFor({state:'detached'});
    assert(await page.locator('.vault-session-controls .music-console').count());
    await page.locator('.vault-session-lock').click();
    await page.locator('[data-vault-gate]').waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS original encrypted layout: 12 widths x 3 languages, full preload, header containment, heading spacing, portrait, controls, mobile menu, inner navigation and lock');
    await context.close();
  } finally { await browser?.close(); await new Promise(r=>server.close(r)); fs.rmSync(temp,{recursive:true,force:true}); }
})().catch(error => { console.error(error); process.exitCode=1; });
