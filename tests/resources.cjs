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

    const previews = '/tmp/lunarvow-boot-preview';
    fs.mkdirSync(previews, {recursive:true});
    const destinations = ['guide.html','hi3.html','gallery.html','story.html','captain-line.html','honkai-info.html'];
    assert.deepEqual(await page.locator('.archive-card').evaluateAll(cards => cards.map(card => card.getAttribute('href'))), destinations);
    assert.equal(await page.locator('.archive-card__media img').count(), 8);
    for (const card of await page.locator('.archive-card').all()) {
      await card.scrollIntoViewIfNeeded();
      const images = await card.locator('img').evaluateAll(async images => Promise.all(images.map(async image => {
        await image.decode();
        return {width:image.naturalWidth,fit:getComputedStyle(image).objectFit,source:image.getAttribute('src')};
      })));
      assert.ok(images.length > 0 && images.every(image => image.width > 0 && image.fit === 'contain'));
      assert.ok(images.every(image => manifest.resources.some(resource => resource.url === image.source)), 'cover images join the complete preload');
    }
    for (const [width,height] of [[1440,900],[390,844]]) {
      await page.setViewportSize({width,height});
      for (const language of ['zh-HK','en']) {
        await page.evaluate(language => window.BHR_I18N.setLanguage(language), language);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const images = await page.locator('.archive-card__media img').evaluateAll(images => images.map(image => {
          const bounds=image.getBoundingClientRect(), frame=image.parentElement.getBoundingClientRect();
          return bounds.width > 0 && bounds.height > 0 && bounds.left >= frame.left - 1 && bounds.right <= frame.right + 1 && bounds.top >= frame.top - 1 && bounds.bottom <= frame.bottom + 1;
        }));
        assert.ok(images.every(Boolean), 'full images stay inside their separate panels');
        await page.locator('.archive-grid').screenshot({path:path.join(previews,`archive-${width}-${language}.png`)});
      }
    }
    await page.locator('.archive-card[href="guide.html"]').click();
    await page.waitForURL('**/guide.html');
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    const featured=page.locator('.featured-guide--illustrated');
    await featured.scrollIntoViewIfNeeded();
    await featured.locator('img').evaluate(image => image.decode());
    assert.equal(await featured.locator('img').evaluate(image => getComputedStyle(image).objectFit), 'contain');
    assert.equal(await featured.locator('.primary-link').getAttribute('href'), 'lunar-vow-guide.html');
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      await featured.screenshot({path:path.join(previews,`guide-cover-${width}.png`)});
    }
    assert.deepEqual(issues, []);
    console.log('PASS resources: six illustrated archive links, complete local cover images, two-language layouts and the featured guide cover');

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
