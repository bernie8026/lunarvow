const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('../data/news.json');
module.exports=async(browser,baseURL)=>{
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}});
  const page=await context.newPage(), errors=[];
  await page.clock.setFixedTime(new Date('2026-10-05T05:00:00Z'));
  await require('./preload-fixture.cjs').configure(page);
  page.on('pageerror',e=>errors.push(e.message));
  const dir='/tmp/lunarvow-boot-preview'; fs.mkdirSync(dir,{recursive:true});
  const ready=async()=>{
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    await page.waitForFunction(()=>window.BHR_I18N && window.BHR_NEWS_DATA);
    await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/i18n.css')));
  };
  const results=()=>page.locator('#news-results .news-card');
  const capture=async(locator,name)=>{
    const style=await page.addStyleTag({content:'html{scroll-behavior:auto!important}.site-header,.site-header *,.section-rail,.skip-link,.music-console,.music-console *{visibility:hidden!important}'});
    try { await locator.scrollIntoViewIfNeeded(); await locator.screenshot({path:path.join(dir,name),animations:'disabled'}); }
    finally {await style.evaluate(el=>el.remove());}
  };
  await page.goto(baseURL+'/news.html');await ready();
  assert.equal(await results().count(),data.items.length);
  assert.equal(await page.locator('.news-stale').isVisible(),false);
  await page.locator('#news-region').selectOption('tw');
  assert.equal(await results().count(),data.items.filter(x=>x.regions.includes('tw')).length);
  assert.equal(await page.locator('#news-results .news-region').allTextContents().then(v=>v.every(x=>x==='台港澳')),true);
  await page.locator('#news-search').fill('月下');
  assert.equal(await results().count(),0);
  await page.locator('[data-news-reset]').click();
  assert.equal(await results().count(),data.items.length);
  assert.equal(await page.locator('#news-search').evaluate(el=>el===document.activeElement),true);
  await page.locator('#news-region').selectOption('cn');
  await page.locator('#news-category').selectOption('equipment');
  await page.locator('#news-search').fill('时序');
  assert.equal(await results().count(),1);
  for(const lang of ['en','zh-CN','zh-HK']) {
    await page.evaluate(lang=>window.BHR_I18N.setLanguage(lang),lang);
    await page.waitForFunction(()=>!document.body.classList.contains('is-language-switching'));
    assert.equal(await results().count(),1);
    assert.equal(await page.locator('#news-search').inputValue(),'时序');
    assert.equal(await page.locator('#news-region').inputValue(),'cn');
    assert.equal(await page.locator('#news-category').inputValue(),'equipment');
  }
  await page.locator('#news-search').fill('');
  await page.locator('#news-region').selectOption('all');
  await page.locator('#news-category').selectOption('all');
  for(const width of [320,390,768,1440,1920]) {
    await page.setViewportSize({width,height:900});
    for(const lang of ['en','zh-CN','zh-HK']) {
      await page.evaluate(lang=>window.BHR_I18N.setLanguage(lang),lang);
      await page.waitForFunction(()=>!document.body.classList.contains('is-language-switching'));
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await results().count(),data.items.length);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'News overflow '+lang+' '+width);
      const failures=await page.locator('.news-card').evaluateAll(cards=>{
        const problems=[];
        for(const card of cards) {
          const bounds=card.getBoundingClientRect();
          for(const el of card.querySelectorAll('h3,.news-summary,.news-period p')) {
            const range=document.createRange();range.selectNodeContents(el);
            for(const r of range.getClientRects()) if(r.left<bounds.left+8 || r.right>bounds.right-8) problems.push(el.textContent);
          }
          for(const a of card.querySelectorAll('a')) if(a.getBoundingClientRect().height<43) problems.push('touch target');
        }
        return problems;
      });
      assert.deepEqual(failures,[],'Framed news text '+lang+' '+width);
      if([390,1440].includes(width)) {
        await page.locator('.news-portrait img').evaluate(async img=>{await img.decode();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
        await capture(page.locator('.news-card--spotlight'),'news-spotlight-'+lang+'-'+width+'.png');
        await page.locator('#news-region').selectOption('tw');
        await capture(page.locator('.news-directory'),'news-tw-'+lang+'-'+width+'.png');
        await page.locator('#news-region').selectOption('all');
      }
    }
  }
  const invalidLinks=await page.locator('.news-source,.news-version').evaluateAll(links=>links.filter(a=>a.protocol!=='https:' || !a.rel.includes('noopener') || !a.rel.includes('noreferrer')).map(a=>a.href));
  assert.deepEqual(invalidLinks,[]);
  await page.goto(baseURL+'/news.html?region=cn&category=story#news-results');await ready();
  assert.equal(await results().count(),1);
  await page.clock.setFixedTime(new Date('2026-11-26T04:00:00+08:00'));
  await page.reload();await ready();
  assert.equal(await page.locator('#spotlight-cn-luna-login .news-status').textContent(),'已結束');
  assert.equal(await page.locator('.news-stale').isVisible(),true);
  await page.clock.setFixedTime(new Date('2026-09-30T12:00:00+08:00'));
  await page.reload();await ready();
  assert.equal(await page.locator('#spotlight-cn-luna-login .news-status').textContent(),'尚未開始');
  await page.clock.setFixedTime(new Date('2026-10-05T05:00:00Z'));
  await page.goto(baseURL);await ready();
  assert.equal(await page.locator('#latest .news-grid .news-card').count(),4);
  assert.equal(await page.locator('#latest .news-card--spotlight').count(),1);
  assert.ok(await page.locator('[data-news-checked]').textContent().then(t=>t.includes('2026.10.05')));
  for(const width of [320,390,768,1440,1920]) {
    await page.setViewportSize({width,height:900});
    for(const lang of ['en','zh-CN','zh-HK']) {
      await page.evaluate(lang=>window.BHR_I18N.setLanguage(lang),lang);
      await page.waitForFunction(()=>!document.body.classList.contains('is-language-switching'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Homepage news overflow '+lang+' '+width);
    }
    if([390,1440].includes(width)) await capture(page.locator('#latest'),'home-news-'+width+'.png');
  }
  await page.locator('.news-browse').click();await ready();
  assert.equal(new URL(page.url()).pathname,'/news.html');
  assert.deepEqual(errors,[]);
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await nojs.goto(baseURL+'/news.html');
  assert.equal(await nojs.locator('#news-results .news-card').count(),data.items.length);
  assert.equal(await nojs.locator('.news-controls').isVisible(),false);
  assert.equal(await nojs.locator('.news-source').first().isVisible(),true);
  assert.ok(await nojs.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await nojs.close();await context.close();
  console.log('PASS news: filters, multilingual search, language persistence, sources, expiry and upcoming boundaries, stale snapshot, responsive frames and no-JS announcements');
};
