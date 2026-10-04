const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
module.exports = async (browser, baseURL) => {
 const errors = [];
 const page = await browser.newPage({ reducedMotion: 'reduce' });
 await require('./preload-fixture.cjs').configure(page);
 page.on('pageerror', e => errors.push(e.message));
 const pages = fs.readdirSync(require('node:path').join(__dirname, '..')).filter(x => x.endsWith('.html'));
 for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  for (const file of pages) {
   await page.goto(baseURL+'/'+file);
   await page.locator('.boot-screen').waitFor({state:'hidden'});
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
   await page.locator('.boot-screen').waitFor({state:'hidden'});
 await page.waitForFunction(()=>window.BHR_I18N);
 await page.waitForFunction(()=>[...document.styleSheets].some(sheet=>sheet.href?.endsWith('/i18n.css')));
 const previews=path.join('/tmp','lunarvow-boot-preview');
 fs.mkdirSync(previews,{recursive:true});
 const capture=async(target,name)=>{
  const style=await page.addStyleTag({content:'html { scroll-behavior: auto !important; } .site-header, .section-rail, .skip-link, .music-console { opacity: 0 !important; }'});
  try {
   await target.scrollIntoViewIfNeeded();
   await target.screenshot({path:path.join(previews,name),animations:'disabled'});
  } finally { await style.evaluate(style=>style.remove()); }
 };
 // Check actual text rectangles inside their frames: page scrollWidth alone
 // misses clipped numbers, oversized glyphs and text touching panel borders.
 for (const width of [320,390,768,1024,1440,1920]) {
  await page.setViewportSize({width,height:900});
  for (const lang of ['en','zh-CN','zh-HK']) {
   await page.evaluate(lang=>window.BHR_I18N.setLanguage(lang),lang);
   await page.waitForFunction(()=>!document.body.classList.contains('is-language-switching'));
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.ok(await page.locator('.skip-link').textContent());
   const layout=await page.evaluate(()=>{
    const failures=[];
    const contains=(outer,inner,inset=0)=>inner.left>=outer.left+inset-1 && inner.right<=outer.right-inset+1 && inner.top>=outer.top+inset-1 && inner.bottom<=outer.bottom-inset+1;
    const checkText=(element,frame,inset,label)=>{
     const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
     for(let node;node=walker.nextNode();) {
      if(!node.textContent.trim()) continue;
      const range=document.createRange(); range.selectNodeContents(node);
      for(const rect of range.getClientRects()) {
       if(!contains(frame.getBoundingClientRect(),rect,inset)) failures.push(label+': '+node.textContent.trim());
      }
     }
    };
    for(const heading of document.querySelectorAll('.section-heading')) {
     const label=heading.closest('section').id;
     for(const child of heading.children) {
      if(getComputedStyle(child).display==='none') continue;
      if(!contains(heading.getBoundingClientRect(),child.getBoundingClientRect(),8)) failures.push(label+' heading child outside padded frame');
     }
     checkText(heading,heading,8,label+' heading text');
     const index=heading.querySelector('.section-index');
     checkText(index,index,3,label+' index glyph');
    }
    const profile=document.querySelector('.profile-layout');
    for(const panel of profile.children) {
     if(!contains(profile.getBoundingClientRect(),panel.getBoundingClientRect(),8)) failures.push('profile panel outside frame');
     for(const paragraph of panel.querySelectorAll('p')) checkText(paragraph,panel,12,'profile paragraph');
    }
    checkText(document.querySelector('.profile-meta'),document.querySelector('.profile-copy'),12,'profile details');
    const copy=document.querySelector('.profile-copy > p').getBoundingClientRect();
    if(innerWidth>=1024 && copy.width<280) failures.push('desktop biography text column too narrow');
    const statement=document.querySelector('.profile-statement');
    const biography=document.querySelector('.profile-copy');
    if(innerWidth<=1000 && biography.getBoundingClientRect().top<statement.getBoundingClientRect().bottom-1) failures.push('narrow profile panels must stack');
    return {failures,scroll:document.documentElement.scrollWidth};
   });
   assert.ok(layout.scroll<=width+1,`homepage ${lang} overflows at ${width}`);
   assert.deepEqual(layout.failures,[],`homepage ${lang} framed text at ${width}`);
   if ([390,1440].includes(width)) {
    for (const section of ['latest','archive']) await capture(page.locator('#'+section+' .section-heading'),`home-heading-${section}-${lang}-${width}.png`);
    await capture(page.locator('#profile'),`home-profile-${lang}-${width}.png`);
   }
   if(width===1920 && lang==='zh-HK') await capture(page.locator('#profile'),`home-profile-${lang}-${width}.png`);
  }
  console.log('PASS homepage framed text in all three languages at width',width);
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
 await require('./preload-fixture.cjs').configure(blocked);
 blocked.on('pageerror',e=>errors.push(e.message));
 await blocked.goto(baseURL);
   await blocked.locator('.boot-screen').waitFor({state:'hidden'});
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
