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
