const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function testGallery(browser, baseURL) {
  const origin = new URL(baseURL).origin;
  const database = fs.readFileSync(path.join(__dirname, '../data/characters.json'), 'utf8');
  const total = JSON.parse(database).length;
  const portrait = fs.readFileSync(path.join(__dirname, '../assets/hi3/characters/kiana-kaslana.webp'));
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });

  try {
    // Keep the checks independent of the portrait host and language CDN.
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      if (route.request().resourceType() === 'image') return route.fulfill({ contentType: 'image/webp', body: portrait });
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('hi3.html', baseURL).href);
    await page.waitForFunction(() => document.querySelector('#grid').getAttribute('aria-busy') === 'false' && window.BHR_I18N);
    assert.equal(await page.locator('.card:visible').count(), total);
    assert.equal(await page.locator('#clear-search').isVisible(), false);
    await page.evaluate(() => { window.galleryOriginalCard = document.querySelector('.card'); });

    for (const query of ['Finality Kiana', 'ＫＩＡＮＡ', '雷電芽衣', '雷电芽衣', 'Lunar Vow Crimson Love']) {
      await page.locator('#search').fill(query);
      assert.equal(await page.locator('.card:visible').count(), 1, `Search: ${query}`);
    }
    await page.locator('#search').fill('this-does-not-exist');
    assert.equal(await page.locator('.card:visible').count(), 0);
    assert.match(await page.locator('#search-status').innerText(), new RegExp(`0.*${total}`));
    await page.locator('#clear-search').click();
    assert.equal(await page.locator('.card:visible').count(), total);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'search');
    assert.equal(await page.evaluate(() => galleryOriginalCard === document.querySelector('.card')), true);

    await page.evaluate(() => BHR_I18N.setLanguage('en'));
    await page.waitForFunction(() => document.querySelector('#search-status').textContent.startsWith('Showing'));
    assert.equal(await page.locator('#search').getAttribute('aria-label'), 'Search characters or battlesuits');
    await page.locator('.card').first().focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.getAttribute('aria-labelledby'), 'lb-caption');
    assert.equal(await page.locator('.lb-close').innerText(), 'CLOSE IMAGE');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'lb-close');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => !document.body.classList.contains('gallery-dialog-open'));
    assert.equal(await page.evaluate(() => document.activeElement === galleryOriginalCard), true);

    for (const [language, label] of [['zh-CN', '搜索角色或战衣'], ['zh-HK', '搜尋角色或戰衣']]) {
      await page.evaluate(language => BHR_I18N.setLanguage(language), language);
      assert.equal(await page.locator('#search').getAttribute('aria-label'), label);
    }
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('.card').first().click();
    await dialog.waitFor({ state: 'visible' });
    await page.locator('.lb-close').scrollIntoViewIfNeeded();
    const bounds = await page.locator('.lb-close').boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 667, 'Mobile close button is reachable');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.lb-close').click();
    assert.deepEqual(errors, []);

    const retryPage = await context.newPage();
    let attempts = 0;
    await retryPage.route('**/data/characters.json', route => {
      attempts += 1;
      return route.fulfill({ status: attempts === 1 ? 503 : 200, contentType: 'application/json', body: database });
    });
    await retryPage.goto(new URL('hi3.html', baseURL).href);
    await retryPage.locator('.empty-state button').waitFor();
    assert.equal(await retryPage.locator('#search').isDisabled(), true);
    await retryPage.locator('.empty-state button').click();
    await retryPage.waitForFunction(total => document.querySelectorAll('.card').length === total, total);
    assert.equal(await retryPage.locator('#search').isEnabled(), true);
    assert.equal(await retryPage.evaluate(() => document.activeElement.id), 'search');
    assert.equal(attempts, 2);

    const emptyPage = await context.newPage();
    await emptyPage.route('**/data/characters.json', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await emptyPage.goto(new URL('hi3.html', baseURL).href);
    await emptyPage.waitForFunction(() => document.querySelector('#grid').getAttribute('aria-busy') === 'false');
    assert.match(await emptyPage.locator('.empty-state').innerText(), /暫時未有角色檔案/);
    assert.equal(await emptyPage.locator('#search').isEnabled(), true);
  } finally {
    await context.close();
  }
};
