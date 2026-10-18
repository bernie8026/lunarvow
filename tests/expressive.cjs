const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async(browser,baseURL)=>{
  const dir='/tmp/lunarvow-boot-preview';fs.mkdirSync(dir,{recursive:true});
  const context=await browser.newContext({
    viewport:{width:1440,height:900},reducedMotion:'no-preference',
    recordVideo:{dir:path.join(dir,'motion-video'),size:{width:1440,height:900}}
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await require('./preload-fixture.cjs').configure(page);
  await page.addInitScript(()=>sessionStorage.setItem('bhr-lunar-arrival-v1','complete'));
  const ready=async()=>{
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    await page.waitForFunction(()=>window.BHR_EXPRESSIVE && window.BHR_I18N);
    await page.waitForFunction(()=>!!document.querySelector('link[href="assets/expressive.css"]')?.sheet);
    await page.evaluate(()=>document.fonts.ready);
  };
  const settle=async(selector)=>{
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForFunction(selector=>{
      // Match the reveal observer's inset and threshold; an edge sliver has not entered yet.
      const bottom=innerHeight-innerWidth*.07;
      return [...document.querySelectorAll(selector+' [data-motion-state],'+selector+'[data-motion-state]')].filter(el=>{
        const r=el.getBoundingClientRect(),width=Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left));
        const height=Math.max(0,Math.min(bottom,r.bottom)-Math.max(0,r.top));
        return r.width*r.height>0 && width*height/(r.width*r.height)>.08;
      }).every(el=>el.dataset.motionState==='ready');
    },selector);
  };
  const capture=async(selector,name)=>{
    const still=await page.addStyleTag({content:'[data-motion-state],[data-image-state]{opacity:1!important;visibility:visible!important;transform:none!important;clip-path:none!important;filter:none!important}'});
    await page.locator(selector+' img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    const saved=await page.evaluate(()=>{
      return [...document.querySelectorAll('.site-header,.section-rail,.music-console,.motion-control,.skip-link')].map(el=>{
        const old=el.getAttribute('style');el.style.setProperty('display','none','important');return [el.className,old];
      });
    });
    try {await page.locator(selector).screenshot({path:path.join(dir,name),animations:'disabled'});}
    finally {await page.evaluate(saved=>{
      for(const [name,style] of saved){const el=[...document.querySelectorAll('.site-header,.section-rail,.music-console,.motion-control,.skip-link')].find(el=>el.className===name);if(el)style===null?el.removeAttribute('style'):el.setAttribute('style',style);}
    },saved);await still.evaluate(el=>el.remove());}
  };
  try {
    await page.goto(baseURL);await ready();
    await page.waitForFunction(()=>document.querySelector('.home-hero h1').dataset.motionState==='ready');
    assert.equal(await page.locator('.hero-orbit').count(),2);
    assert.equal(await page.locator('.hero-dust i').count(),14);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.hero-orbit')).animationPlayState==='running');
    assert.equal(await page.locator('.motion-control').isVisible(),true);
    await page.screenshot({path:path.join(dir,'motion-hero-desktop.png')});
    await page.mouse.move(1000,300);
    await page.locator('.motion-control').click();
    assert.equal(await page.locator('.motion-control').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('.hero-orbit').evaluateAll(elements=>elements.every(el=>getComputedStyle(el).animationPlayState==='paused')));
    await page.reload();await ready();
    assert.equal(await page.locator('.motion-control').getAttribute('aria-pressed'),'true');
    await page.locator('.motion-control').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.hero-orbit')).animationPlayState==='running');
    const scene=await page.locator('.hero-atmosphere').evaluate(el=>getComputedStyle(el).transform);
    await page.mouse.move(1320,200);
    await page.waitForFunction(previous=>getComputedStyle(document.querySelector('.hero-atmosphere')).transform!==previous,scene);
    await settle('#latest');
    await capture('#latest','motion-latest-desktop.png');
    await settle('#latest .news-topic:first-child');
    assert.ok(await page.locator('#latest .news-topic').count()>1,'Home news has distinct subject groups');
    assert.equal(await page.locator('#latest .news-grid .news-card').first().evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
    await settle('#archive');
    const cards=page.locator('.archive-card');
    assert.equal(await cards.count(),6);
    await cards.nth(1).hover();
    await page.waitForFunction(()=>document.querySelectorAll('.archive-card')[1].classList.contains('is-active'));
    await page.waitForFunction(()=>document.querySelectorAll('.archive-card')[1].querySelector('.archive-card__media').getBoundingClientRect().height>200);
    await cards.nth(2).focus();
    assert.equal(await cards.nth(2).evaluate(el=>el.classList.contains('is-active')),true);
    assert.equal(await cards.nth(2).evaluate(el=>getComputedStyle(el).opacity),'1','Keyboard focus reveals the active archive row');
    await capture('.archive-grid','motion-archive-desktop.png');
    await settle('#profile');
    assert.equal(await page.locator('.profile-signature path').count(),1);
    await capture('#profile','motion-profile-desktop.png');
    const kinds=await page.locator('[data-motion-kind]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.motionKind))]);
    for(const kind of ['hero-rise','image-unfold','portrait-focus','topic-entry','title-track']) assert.ok(kinds.includes(kind),'Distinct reveal: '+kind);
    for(const width of [320,390,768,1440,1920]){
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Motion layout overflow '+width);
      assert.ok(await page.locator('.motion-control').evaluate(el=>{
        const a=el.getBoundingClientRect(),b=document.querySelector('.music-console').getBoundingClientRect();
        return a.right<=b.left || a.left>=b.right || a.bottom<=b.top || a.top>=b.bottom;
      }),'Music and motion controls have separate hit areas at '+width);
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(baseURL);await ready();
    await page.locator('.music-console__toggle').focus();
    assert.ok(await page.locator('.motion-control').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.music-console').getBoundingClientRect().top),'Expanded mobile audio dock does not cover pause');
    await page.locator('.motion-control').focus();
    await page.locator('.home-hero h1').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelector('.home-hero h1').dataset.motionState==='ready');
    await page.screenshot({path:path.join(dir,'motion-hero-mobile.png')});
    await settle('#archive');await capture('.archive-grid','motion-archive-mobile.png');
    await page.setViewportSize({width:1440,height:900});
    await page.goto(baseURL+'/gallery.html');await ready();
    await settle('.photo-grid');await capture('.photo-grid','motion-gallery-desktop.png');
    for(const image of await page.locator('.photo-entry__image img').all()) assert.equal(await image.evaluate(el=>getComputedStyle(el).objectFit),'contain');
    await page.goto(baseURL+'/story.html');await ready();
    const story=page.locator('.story-timeline').first();
    await story.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>!!document.querySelector('.story-step[data-motion-kind="story-line"]'));
    assert.deepEqual(errors,[]);
  }finally{
    await context.close();
  }
  const reduced=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
  await require('./preload-fixture.cjs').configure(reduced);
  await reduced.addInitScript(()=>sessionStorage.setItem('bhr-lunar-arrival-v1','complete'));
  await reduced.goto(baseURL);
  await reduced.locator('.boot-screen').waitFor({state:'hidden'});
  await reduced.waitForFunction(()=>window.BHR_EXPRESSIVE);
  assert.equal(await reduced.locator('.motion-control').isVisible(),false);
  assert.equal(await reduced.locator('.hero-orbit').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await reduced.locator('.archive-card__media').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await reduced.close();
  console.log('PASS expressive: distinct scene motion, topic groups, pointer/keyboard archive expansion, pause persistence, full photos, responsive layouts and reduced motion');
};
