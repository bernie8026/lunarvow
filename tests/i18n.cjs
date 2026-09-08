const assert = require('node:assert/strict');

const fixture = `<!doctype html><html lang="zh-HK"><head><meta charset="utf-8"><meta name="description" content="test"></head><body>
<header data-header><div class="site-header__status"></div></header>
<main><h1 id="heading">角色圖鑑</h1><button id="action" aria-label="開啟導覽選單">相片庫</button>
<input id="search" placeholder="輸入角色或戰衣名稱…"><img id="portrait" alt="月下誓約・予愛以心角色立繪">
<p id="owned" data-i18n-ignore aria-label="返回首頁">角色圖鑑</p><p id="untranslated" translate="no">相片庫</p>
<textarea id="note">角色圖鑑</textarea></main></body></html>`;

module.exports = async (browser, baseURL) => {
  const context = await browser.newContext();
  const origin = baseURL.replace(/\/$/, '');
  const errors = [];
  const createFixture = async () => {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route(`${origin}/__i18n_test__`, route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixture }));
    await page.goto(`${origin}/__i18n_test__`);
    return page;
  };

  try {
    const page = await createFixture();
    await page.evaluate(() => Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Blocked', 'SecurityError'); }
    }));
    await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
    await page.addScriptTag({ url: `${origin}/assets/i18n.js` });
    assert.equal(await page.evaluate(() => window.BHR_I18N.language), 'zh-HK');
    await page.evaluate(() => window.BHR_I18N.setLanguage('en', true));
    assert.equal(await page.textContent('#heading'), 'Character Database');
    assert.equal(await page.getAttribute('.language-announcer', 'lang'), 'en');
    console.log('PASS i18n: blocked storage does not prevent initialization or switching.');

    assert.equal(await page.getAttribute('#action', 'aria-label'), 'Open navigation menu');
    assert.equal(await page.getAttribute('#portrait', 'alt'), 'Lunar Vow: Crimson Love character artwork');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-HK', true));
    assert.equal(await page.getAttribute('#action', 'aria-label'), '開啟導覽選單');
    assert.equal(await page.getAttribute('#portrait', 'alt'), '月下誓約・予愛以心角色立繪');
    assert.equal(await page.getAttribute('#search', 'placeholder'), '輸入角色或戰衣名稱…');
    await page.evaluate(() => window.BHR_I18N.setLanguage('en'));
    await page.evaluate(() => {
      document.querySelector('#action').setAttribute('aria-label', '返回首頁');
      document.querySelector('#heading').firstChild.nodeValue = '相片庫';
    });
    assert.equal(await page.getAttribute('#action', 'aria-label'), 'Return to home');
    assert.equal(await page.textContent('#heading'), 'Gallery');
    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-HK'));
    assert.equal(await page.getAttribute('#action', 'aria-label'), '返回首頁');
    assert.equal(await page.textContent('#heading'), '相片庫');
    console.log('PASS i18n: original text and attributes survive round trips and external mutations.');

    await page.evaluate(() => window.BHR_I18N.setLanguage('en'));
    assert.equal(await page.textContent('#owned'), '角色圖鑑');
    assert.equal(await page.getAttribute('#owned', 'aria-label'), '返回首頁');
    assert.equal(await page.textContent('#untranslated'), '相片庫');
    assert.equal(await page.inputValue('#note'), '角色圖鑑');
    console.log('PASS i18n: component optouts and user text are preserved.');

    await page.evaluate(() => window.BHR_I18N.setLanguage('zh-CN', true));
    assert.deepEqual(await page.evaluate(() => ['琪亞娜·卡斯蘭娜', '雷電芽衣', '布洛妮婭·捷伊慈克', '菲謝爾', '八重櫻', '卡蘿爾·佩珀']
      .map(value => window.BHR_I18N.translate(value))),
    ['琪亚娜·卡斯兰娜', '雷电芽衣', '布洛妮娅·捷伊慈克', '菲谢尔', '八重樱', '卡萝尔·佩珀']);
    assert.equal(await page.getAttribute('html', 'lang'), 'zh-CN');
    assert.equal(await page.textContent('.language-announcer'), '语言已切换为简体中文。');
    assert.equal(await page.getAttribute('.language-announcer', 'lang'), 'zh-CN');
    assert.equal(await page.getAttribute('button[data-language="zh-CN"]', 'aria-pressed'), 'true');
    await page.evaluate(() => window.BHR_I18N.setLanguage('en'));
    assert.equal(await page.getAttribute('#action', 'aria-label'), 'Return to home');
    console.log('PASS i18n: offline Simplified Chinese uses bundled conversion and correct accessible state.');

    const race = await createFixture();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await race.route('https://cdn.jsdelivr.net/**', async route => {
      await gate;
      await route.fulfill({ contentType: 'text/javascript', body: 'window.OpenCC = { Converter: () => value => value };' });
    });
    await race.addScriptTag({ url: `${origin}/assets/i18n.js` });
    await race.evaluate(() => {
      window.changes = [];
      window.ready = [];
      window.addEventListener('bhr:languagechange', event => window.changes.push(event.detail.language));
      window.addEventListener('bhr:translationsready', event => window.ready.push(event.detail.language));
      window.pendingLanguage = window.BHR_I18N.setLanguage('zh-CN');
    });
    assert.equal(await race.getAttribute('button[data-language="zh-CN"]', 'aria-pressed'), 'true');
    assert.equal(await race.textContent('#heading'), '角色图鉴');
    await race.evaluate(() => window.BHR_I18N.setLanguage('en'));
    release();
    await race.evaluate(() => window.pendingLanguage);
    assert.equal(await race.getAttribute('html', 'lang'), 'en');
    assert.equal(await race.textContent('#heading'), 'Character Database');
    assert.deepEqual(await race.evaluate(() => window.changes), ['zh-CN', 'en']);
    assert.deepEqual(await race.evaluate(() => window.ready), []);
    await race.evaluate(() => window.BHR_I18N.setLanguage('zh-CN'));
    assert.deepEqual(await race.evaluate(() => window.ready), ['zh-CN']);
    assert.deepEqual(errors, []);
    console.log('PASS i18n: delayed conversion cannot overwrite a newer language or emit a stale event.');
  } finally {
    await context.close();
  }
};
