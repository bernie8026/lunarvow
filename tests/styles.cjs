const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async (browser, baseURL) => {
  const previews = '/tmp/lunarvow-boot-preview';
  fs.mkdirSync(previews, {recursive:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(() => sessionStorage.setItem('bhr-lunar-arrival-v1','complete'));
  await context.route('**/assets/preload-manifest.json', route => route.fulfill({
    contentType:'application/json', body:JSON.stringify({resources:[
      {url:'style.css',type:'fetch'}, {url:'assets/news.css',type:'fetch'}, {url:'assets/i18n.css',type:'fetch'}
    ]})
  }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let releaseRepair;
  const repair = new Promise(resolve => { releaseRepair = resolve; });
  const newsRequests = [];
  await context.route(/\/assets\/news\.css(?:\?.*)?$/, async route => {
    if (route.request().resourceType() !== 'stylesheet') { await route.continue(); return; }
    const retry = new URL(route.request().url()).searchParams.has('_bhr_style_retry');
    newsRequests.push(retry);
    if (!retry) { await route.fulfill({contentType:'text/css',body:''}); return; }
    await repair;
    await route.continue();
  });
  try {
    await page.goto(baseURL + '/index.html', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => [...document.querySelectorAll('link')].some(link =>
      link.href.includes('/assets/news.css?') && link.href.includes('_bhr_style_retry')));
    assert.equal(await page.locator('.boot-screen').isVisible(), true);
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), true);
    assert.equal(await page.locator('.boot-screen__skip-animation').isVisible(), false);
    assert.deepEqual(newsRequests, [false,true], 'an empty applied stylesheet gets one automatic retry');
    releaseRepair();
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    assert.equal(await page.locator('link[href*="/assets/news.css"]').count(), 1, 'reload preserves one stylesheet at its cascade position');
    const order = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => new URL(link.href).pathname));
    assert.ok(order.findIndex(p => p.endsWith('/news.css')) < order.findIndex(p => p.endsWith('/expressive.css')));
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:1000});
      const layout = await page.evaluate(() => {
        const versions = document.querySelector('.news-versions');
        const spotlight = document.querySelector('.news-card--spotlight');
        const image = spotlight.querySelector('img');
        const picture = spotlight.querySelector('figure').getBoundingClientRect();
        const copy = spotlight.querySelector('.news-card__body').getBoundingClientRect();
        return {versions:getComputedStyle(versions).display,spotlight:getComputedStyle(spotlight).display,
          fit:getComputedStyle(image).objectFit,sideBySide:picture.right<=copy.left+1,
          stacked:picture.bottom<=copy.top+1,overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(layout.versions,'grid');
      assert.equal(layout.spotlight,'grid');
      assert.equal(layout.fit,'contain', 'the Lunar Vow portrait keeps its full proportions');
      assert.equal(layout.overflow,false);
      assert.ok(width>640 ? layout.sideBySide : layout.stacked);
      await page.locator('.news-card--spotlight').screenshot({path:path.join(previews,`styles-recovered-${width}.png`)});
    }
    console.log('PASS styles: a 200/empty stylesheet stays behind loading, retries once and restores desktop/mobile news layout');

    await context.unroute(/\/assets\/news\.css(?:\?.*)?$/);
    let broken = true;
    let styleTransfers = 0;
    let languageAttempts = 0;
    await context.route('**/style.css', async route => {
      if (route.request().resourceType() === 'fetch') styleTransfers++;
      await route.continue();
    });
    await context.route(/\/assets\/i18n\.css(?:\?.*)?$/, async route => {
      if (route.request().resourceType() === 'stylesheet') {
        languageAttempts++;
        if (broken) { await route.fulfill({contentType:'text/css',body:''}); return; }
      }
      await route.continue();
    });
    await page.goto(baseURL + '/index.html');
    await page.locator('.boot-screen__retry').waitFor({state:'visible'});
    assert.equal(languageAttempts,2, 'persistent failure stops after one automatic retry');
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert), true);
    assert.equal(await page.locator('.boot-screen__skip-animation').isVisible(), false);
    assert.match(await page.locator('.boot-screen__errors').textContent(), /assets\/i18n\.css/);
    for (const [language,reason] of [['zh-HK','版面樣式未能套用'],['en','Page styles could not apply'],['zh-CN','页面样式未能应用']]) {
      await page.evaluate(language => window.BHR_I18N.setLanguage(language), language);
      assert.ok((await page.locator('.boot-screen__errors').textContent()).includes(reason));
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.boot-screen').isVisible(),true);
    const previousTransfers = styleTransfers;
    broken = false;
    await page.locator('.boot-screen__retry').click();
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    assert.equal(languageAttempts,3);
    assert.equal(styleTransfers,previousTransfers, 'manual retry retains completed resource downloads');
    assert.equal(await page.locator('#main-content').evaluate(el => el.inert),false);
    assert.ok(await page.locator('#bhr-i18n-style').evaluate(link => link.sheet.cssRules.length > 0));
    assert.deepEqual(errors,[]);
    console.log('PASS styles: dynamically injected styles, bounded retries, three-language errors and selective manual recovery');
  } finally {
    releaseRepair();
    await context.close();
  }
};
