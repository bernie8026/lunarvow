const assert = require('node:assert/strict');
const fs = require('node:fs');
module.exports = async (browser, baseURL) => {
 const errors = [];
 const page = await browser.newPage({ reducedMotion: 'reduce' });
 page.on('pageerror', e => errors.push(e.message));
 const pages = fs.readdirSync(require('node:path').join(__dirname, '..')).filter(x => x.endsWith('.html'));
 for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  for (const file of pages) {
   await page.goto(baseURL+'/'+file);
   await page.waitForFunction(()=>window.BHR_I18N);
   await page.waitForFunction(()=>[...document.styleSheets].some(sheet=>sheet.href?.endsWith('/i18n.css')));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result = await page.evaluate(()=>({
    width:innerWidth, scroll:document.documentElement.scrollWidth,
    mains:document.querySelectorAll('#main-content').length,
    skip:!!document.querySelector('.skip-link'),
    title:document.querySelector('h1')?.textContent.trim(),
    navVisible:getComputedStyle(document.querySelector('[data-menu]')).visibility,
    hidden:[...document.querySelectorAll('main h1,main h2')].filter(el=>getComputedStyle(el).visibility==='hidden').length
   }));
   assert.ok(result.scroll<=width+1,`${file} overflows at ${width}: ${JSON.stringify(result)}`);
   assert.equal(result.mains,1,`${file} main target`);
   assert.ok(result.skip,`${file} skip link`);
   assert.equal(result.hidden,0,`${file} reduced-motion content hidden`);
   if (width<=820) {
    assert.equal(result.navVisible,'hidden',`${file} at ${width}: nav should start closed`);
    await page.locator('[data-menu-toggle]').click();
    assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('[data-menu-toggle]').evaluate(el=>el===document.activeElement),true);
   }
  }
  console.log('PASS all pages at width',width);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(baseURL);
 await page.waitForFunction(()=>window.BHR_I18N);
 for (const lang of ['en','zh-CN','zh-HK','en','zh-HK']) {
  await page.evaluate(lang=>window.BHR_I18N.setLanguage(lang),lang);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);
  assert.ok(await page.locator('.skip-link').textContent());
 }
 await page.setViewportSize({width:390,height:844});
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 for (const file of pages) {
  await nojs.goto(baseURL+'/'+file);
  assert.equal(await nojs.locator('.boot-screen').count(),0);
  assert.ok(await nojs.locator('[data-menu] a').first().isVisible(), file+' no-JS navigation');
 } 
 console.log('PASS JavaScript-disabled navigation and archive');
 const blocked=await browser.newPage({reducedMotion:'reduce'});
 await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}})});
 blocked.on('pageerror',e=>errors.push(e.message));
 await blocked.goto(baseURL);
 await blocked.waitForFunction(()=>window.BHR_I18N);
 await blocked.evaluate(()=>window.BHR_I18N.setLanguage('en'));
 assert.equal(await blocked.locator('html').getAttribute('lang'),'en');
 assert.ok(await blocked.locator('.music-console__toggle').isVisible());
 console.log('PASS blocked storage');
 assert.deepEqual(errors,[]);
 console.log('PASS no page errors');
 await page.context().close();
 await nojs.context().close();
 await blocked.context().close();
};
