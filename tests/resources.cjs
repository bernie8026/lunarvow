const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

module.exports = async (browser, baseURL) => {
  const page = await browser.newPage({reducedMotion: 'reduce'});
  const issues = [];
  page.on('pageerror', error => issues.push(error.message));
  await page.route('**/*', route => {
    assert.ok(route.request().url().startsWith(baseURL + '/'), 'no external runtime resources');
    return route.continue();
  });
  await page.addInitScript(() => {
    let preloader;
    window.preloadUpdates = [];
    Object.defineProperty(window, 'BHR_PRELOADER', {
      get: () => preloader,
      set(value) {
        const create = value.create;
        value.create = callback => create(progress => {
          window.preloadUpdates.push(progress);
          callback(progress);
        });
        preloader = value;
      }
    });
  });
  try {
    await page.goto(baseURL + '/index.html');
    await page.locator('.boot-screen').waitFor({state: 'hidden', timeout: 30000});
    const progress = await page.evaluate(() => window.preloadUpdates.at(-1));
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/preload-manifest.json')));
    assert.equal(progress.total, manifest.resources.length);
    assert.equal(progress.loaded, progress.total);
    assert.deepEqual(progress.failed, []);
    const characters = JSON.parse(fs.readFileSync(path.join(root, 'data/characters.json')));
    assert.equal(characters.length, 21);
    const sizes = await page.evaluate(async characters => Promise.all(characters.map(async character => {
      const image = new Image();
      image.src = new URL(character.image, location.href).href;
      await image.decode();
      return image.naturalWidth;
    })), characters);
    assert.ok(sizes.every(width => width > 0));
    await page.waitForFunction(() => window.BHR_I18N);
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-CN'));
    assert.equal(await page.evaluate(() => window.OpenCC.Converter({from:'hk',to:'cn'})('乾隆乾坤乾燥')), '乾隆乾坤干燥');
    assert.deepEqual(issues, []);
    console.log('PASS resources: real complete manifest, full audio transfer, all 21 portraits and local OpenCC');

    await page.goto(baseURL + '/gallery.html');
    await page.locator('.boot-screen').waitFor({state: 'hidden'});
    await page.waitForFunction(() => window.BHR_I18N);
    const pictures = await page.locator('.photo-entry__image').evaluateAll(async links => Promise.all(links.map(async link => {
      const image = link.querySelector('img');
      await image.decode();
      return { source: image.src, full: link.href, width: image.naturalWidth, height: image.naturalHeight,
        fit: getComputedStyle(image).objectFit };
    })));
    assert.equal(pictures.length, 8);
    assert.ok(pictures.every(image => image.width > 0 && image.height > 0 && image.source === image.full && image.fit === 'contain'));
    const additions = pictures.filter(image => image.source.includes('/assets/lunar-collection/'));
    assert.equal(additions.length, 6);
    assert.equal(additions.filter(image => image.height > image.width).length, 2);
    for (const image of additions) assert.ok(manifest.resources.some(resource => new URL(resource.url, baseURL + '/').href === image.source));
    for (const [language, title] of [['en', 'Lunar Vow: Crimson Love official promotional artwork'],
      ['zh-CN', '月下誓约・予爱以心官方宣传图'], ['zh-HK', '月下誓約・予愛以心官方宣傳圖']]) {
      await page.evaluate(language => window.BHR_I18N.setLanguage(language), language);
      assert.equal(await page.locator('.photo-entry h3').first().textContent(), title);
      assert.equal(await page.locator('.photo-entry img').first().getAttribute('alt'), title);
    }
    const popupEvent = page.waitForEvent('popup');
    await page.locator('.photo-entry__image').first().click();
    const popup = await popupEvent;
    await popup.waitForLoadState();
    assert.equal(popup.url(), pictures[0].full);
    await popup.close();
    assert.deepEqual(issues, []);
    console.log('PASS resources: all eight gallery images decode locally, retain full proportions, open full images, and translate in three languages');

    let broken = true;
    await page.route('**/assets/hi3/portraits/kiana-kaslana.png', route => broken ? route.abort() : route.continue());
    await page.goto(baseURL + '/index.html');
    await page.locator('.boot-screen__retry').waitFor({state: 'visible'});
    assert.equal(await page.locator('.boot-screen').count(), 1);
    assert.equal(await page.locator('.boot-screen__skip').count(), 0);
    assert.match(await page.locator('.boot-screen__errors').textContent(), /kiana-kaslana\.png/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.boot-screen').count(), 1);
    broken = false;
    await page.locator('.boot-screen__retry').click();
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    assert.deepEqual(await page.evaluate(() => window.preloadUpdates.at(-1).failed), []);
    console.log('PASS resources: real failed image keeps the page locked until selective retry succeeds');
  } finally {
    await page.context().close();
  }
};
