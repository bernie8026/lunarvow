const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async (browser, baseURL) => {
  const context = await browser.newContext({ viewport: {width:1440,height:900} });
  const issues = [];
  const previews = '/tmp/lunarvow-boot-preview';
  fs.mkdirSync(previews, {recursive:true});
  let release;
  let pending = new Promise(resolve => { release = resolve; });
  // Simulate an older cached base stylesheet without the new import.
  await context.route('**/style.css', route => route.fulfill({contentType:'text/css',
    body:fs.readFileSync(path.join(__dirname,'../style.css'),'utf8').replace('@import url("assets/boot-cinematic.css");','') }));
  await context.route('**/assets/preload-manifest.json', route => route.fulfill({contentType:'application/json', body:JSON.stringify({
    resources:[{url:'style.css',type:'fetch'},{url:'assets/lunar-collection/crimson-vow-mobile.webp',type:'image'}]
  })}));
  await context.route('**/assets/lunar-collection/crimson-vow-mobile.webp', async route => { await pending; await route.fallback(); });
  const page = await context.newPage();
  page.on('pageerror', error => issues.push(error.message));
  try {
    await page.goto(baseURL + '/index.html', {waitUntil:'domcontentloaded'});
    const screen = page.locator('.boot-screen');
    await page.waitForFunction(() => document.querySelector('.boot-screen__bar')?.getAttribute('aria-valuenow') === '50');
    assert.equal(await page.locator('.boot-screen--cinematic').count(), 1);
    assert.equal(await page.locator('#bhr-cinematic-style').count(), 1);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('bhr-lunar-arrival-v1')), null);
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), true);
    assert.equal(await page.locator('.boot-screen__ring-progress').getAttribute('stroke-dashoffset'), '50');
    assert.equal(await page.locator('.boot-screen__percentage').textContent(), '050%');
    assert.equal(await page.locator('.boot-screen__skip-animation').isVisible(), false);
    await page.keyboard.press('Escape');
    assert.equal(await screen.isVisible(), true);
    await page.locator('.boot-screen__art').evaluate(img => img.decode());
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.boot-screen__art')).opacity === '1' &&
      getComputedStyle(document.querySelector('.boot-screen__poem')).opacity === '1');
    for (const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({width,height});
      const bounds = await page.evaluate(() => {
        const root = document.querySelector('.boot-screen');
        const status = document.querySelector('.boot-screen__status').getBoundingClientRect();
        const art = document.querySelector('.boot-screen__art');
        const artBox = art.getBoundingClientRect();
        const consoleTop = document.querySelector('.boot-screen__console').getBoundingClientRect().top;
        return {overflow:root.scrollWidth > root.clientWidth + 1,statusBottom:status.bottom,
          artWidth:art.naturalWidth,fit:getComputedStyle(art).objectFit,artBottom:artBox.bottom,consoleTop};
      });
      assert.equal(bounds.overflow, false, `cinematic width ${width}`);
      assert.ok(bounds.statusBottom <= height, `progress remains in view at ${width} × ${height}`);
      assert.ok(bounds.artWidth > 0);
      assert.equal(bounds.fit, 'contain');
      assert.ok(bounds.artBottom <= bounds.consoleTop + 1, `artwork does not overlap progress at ${width} × ${height}`);
      await page.screenshot({path:path.join(previews, `arrival-${width}x${height}.png`)});
    }
    await page.setViewportSize({width:1440,height:900});
    await page.waitForFunction(() => window.BHR_I18N);
    await page.evaluate(() => window.BHR_I18N.setLanguage('en'));
    assert.equal(await page.locator('.boot-screen__title').textContent(), 'LUNAR VOW');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-CN'));
    assert.equal(await page.locator('.boot-screen__title').textContent(), '月下誓约');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-HK'));
    release();
    const skip = page.locator('.boot-screen__skip-animation');
    await skip.waitFor({state:'visible'});
    assert.equal(await page.locator('.boot-screen__bar').getAttribute('aria-valuenow'), '100');
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), true);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('bhr-lunar-arrival-v1')), null);
    assert.equal(await page.locator('.boot-screen.is-unveiling').count(), 0);
    await page.evaluate(() => window.BHR_I18N.setLanguage('en'));
    assert.equal(await skip.textContent(), 'Skip animation');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-CN'));
    assert.equal(await skip.textContent(), '跳过动画 / SKIP');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-HK'));
    assert.equal(await skip.textContent(), '跳過動畫 / SKIP');
    for (const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({width,height});
      const bounds = await skip.boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height, `ready Skip remains in view at ${width} × ${height}`);
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
      await page.screenshot({path:path.join(previews, `arrival-ready-${width}x${height}.png`)});
    }
    await page.keyboard.press('Tab');
    assert.equal(await skip.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    await screen.waitFor({state:'detached'});
    assert.equal(await page.evaluate(() => sessionStorage.getItem('bhr-lunar-arrival-v1')), 'complete');
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), false);

    pending = new Promise(resolve => { release = resolve; });
    await page.goto(baseURL + '/gallery.html', {waitUntil:'domcontentloaded'});
    await screen.waitFor({state:'visible'});
    assert.equal(await page.locator('.boot-screen--cinematic').count(), 0);
    assert.equal(await page.locator('.boot-screen__skip-animation').isVisible(), false);
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), true);
    release();
    await screen.waitFor({state:'detached'});
    console.log('PASS cinematic: ready-only Skip, translated labels, keyboard entry, and compact subsequent navigation');
    console.log('PASS cinematic: full artwork, progress and ready Skip at desktop, narrow mobile and landscape sizes');

    const failed = await browser.newPage({viewport:{width:390,height:844}});
    let broken = true;
    await failed.route('**/assets/preload-manifest.json', route => route.fulfill({contentType:'application/json',body:JSON.stringify({
      resources:[{url:'style.css',type:'fetch'},{url:'assets/lunar-collection/crimson-vow-mobile.webp',type:'image'}]
    })}));
    await failed.route('**/assets/lunar-collection/crimson-vow-mobile.webp', route => broken ? route.abort() : route.continue());
    failed.on('pageerror', error => issues.push(error.message));
    await failed.goto(baseURL + '/index.html');
    await failed.locator('.boot-screen__retry').waitFor({state:'visible'});
    assert.equal(await failed.locator('.boot-screen--cinematic[data-phase="failed"]').count(), 1);
    assert.equal(await failed.locator('.boot-screen__skip-animation').isVisible(), false);
    assert.equal(await failed.evaluate(() => sessionStorage.getItem('bhr-lunar-arrival-v1')), null);
    const retryBounds = await failed.locator('.boot-screen__retry').boundingBox();
    assert.ok(retryBounds.y >= 0 && retryBounds.y + retryBounds.height <= 844);
    await failed.screenshot({path:path.join(previews,'arrival-failed-mobile.png')});
    broken = false;
    await failed.locator('.boot-screen__retry').click();
    await failed.locator('.boot-screen__skip-animation').click();
    await failed.locator('.boot-screen').waitFor({state:'detached'});
    assert.equal(await failed.evaluate(() => sessionStorage.getItem('bhr-lunar-arrival-v1')), 'complete');
    await failed.context().close();
    console.log('PASS cinematic: a failed image preserves first arrival and accessible retry until success');

    const reduced = await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
    await reduced.addInitScript(() => Object.defineProperty(window, 'sessionStorage', {get(){throw new DOMException('blocked','SecurityError');}}));
    await require('./preload-fixture.cjs').configure(reduced);
    reduced.on('pageerror', error => issues.push(error.message));
    await reduced.goto(baseURL + '/index.html');
    await reduced.locator('.boot-screen__skip-animation').click();
    await reduced.locator('.boot-screen').waitFor({state:'detached'});
    assert.equal(await reduced.locator('#main-content').evaluate(el => el.inert), false);
    await reduced.context().close();
    assert.deepEqual(issues, []);
    console.log('PASS cinematic: reduced motion and blocked session storage remain usable');
  } finally {
    release();
    await context.close();
  }
};
