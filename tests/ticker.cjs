const assert=require('node:assert/strict'),fs=require('node:fs');
module.exports=async(browser,baseURL)=>{
  const context=await browser.newContext({viewport:{width:2047,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await require('./preload-fixture.cjs').configure(page);
  await page.addInitScript(()=>sessionStorage.setItem('bhr-lunar-arrival-v1','complete'));
  try {
    await page.goto(baseURL);
    await page.locator('.boot-screen').waitFor({state:'hidden'});
    await page.waitForFunction(()=>window.BHR_EXPRESSIVE && window.BHR_I18N && document.querySelector('.signal-ticker').dataset.tickerReady==='true');
    await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
    await page.locator('.motion-control').click();
    await page.waitForFunction(()=>document.body.classList.contains('ambient-paused'));
    await page.evaluate(()=>{window.tickerAnimation=document.querySelector('.signal-ticker__track').getAnimations().find(a=>a.animationName==='ticker');});
    const fitted=()=>page.waitForFunction(()=>{
      const [first,second]=document.querySelectorAll('.signal-ticker__group'),ticker=document.querySelector('.signal-ticker');
      const stride=first.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(first).columnGap);
      return first.textContent===second.textContent && first.children.length===Math.max(1,Math.ceil(ticker.clientWidth/stride)) && first.getBoundingClientRect().width>=ticker.clientWidth;
    });
    fs.mkdirSync('/tmp/lunarvow-boot-preview',{recursive:true});
    for(const width of [320,390,1440,2047,2560,3840]) {
      const previousX=await page.evaluate(()=>{
        tickerAnimation.currentTime=1234;
        return new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.signal-ticker__track')).transform).m41;
      });
      await page.setViewportSize({width,height:900});
      await fitted();
      const resizedX=await page.locator('.signal-ticker__track').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
      assert.ok(Math.abs(resizedX-previousX)<.1,'Resize retains position at '+width);
      for(const language of ['zh-HK','en','zh-CN']) {
        const languageX=await page.evaluate(()=>{
          tickerAnimation.currentTime=1234;
          return new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.signal-ticker__track')).transform).m41;
        });
        await page.evaluate(language=>BHR_I18N.setLanguage(language),language);
        await fitted();
        await page.evaluate(()=>document.fonts.ready);
        const result=await page.evaluate(()=>{
          const ticker=document.querySelector('.signal-ticker'),track=ticker.firstElementChild;
          const [first,second]=track.children,animation=track.getAnimations().find(a=>a.animationName==='ticker');
          const duration=animation.effect.getComputedTiming().duration;
          const retainedX=new DOMMatrixReadOnly(getComputedStyle(track).transform).m41,jumps=[];
          const position=time=>{
            animation.currentTime=time;
            return new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
          };
          // Compare the visible copy before each wrap with the original after it.
          for(const cycle of [1,2,5]) {
            position(duration*cycle-.5);
            const before=second.querySelector('span').getBoundingClientRect().left;
            position(duration*cycle+.5);
            const after=first.querySelector('span').getBoundingClientRect().left;
            jumps.push(Math.abs(after-before));
          }
          const joiningGap=second.querySelector('span').getBoundingClientRect().left-first.lastElementChild.lastElementChild.getBoundingClientRect().right;
          return {sameAnimation:animation===tickerAnimation,retainedX,jumps,joiningGap,
            gap:parseFloat(getComputedStyle(first).columnGap),firstWidth:first.getBoundingClientRect().width,
            secondWidth:second.getBoundingClientRect().width,viewport:ticker.clientWidth,
            speed:first.getBoundingClientRect().width/duration*1000,
            overflow:document.documentElement.scrollWidth>innerWidth+1};
        });
        assert.equal(result.sameAnimation,true,'Resize/language keeps the existing animation');
        assert.ok(Math.abs(result.retainedX-languageX)<.1,'Language change retains position at '+width+' '+language);
        assert.ok(result.firstWidth>=result.viewport,'A complete repeat covers the viewport');
        assert.ok(Math.abs(result.firstWidth-result.secondWidth)<.01,'Both repeated groups have equal widths');
        assert.ok(result.jumps.every(jump=>jump<.2),'No visible jump across three loop boundaries: '+JSON.stringify(result));
        assert.ok(Math.abs(result.joiningGap-result.gap)<.01,'Joining space matches all other spaces');
        assert.ok(Math.abs(result.speed-48)<.01,'Constant speed across screen sizes and languages');
        assert.equal(result.overflow,false);
        if(width===2047 && language!=='zh-CN') await page.locator('.signal-ticker').screenshot({path:'/tmp/lunarvow-boot-preview/ticker-'+language+'-2047.png',animations:'allow'});
      }
    }
    await page.locator('.signal-ticker').scrollIntoViewIfNeeded();
    const paused=await page.evaluate(()=>{tickerAnimation.currentTime=1234;return tickerAnimation.currentTime;});
    await page.locator('.motion-control').click();
    await page.waitForFunction(time=>tickerAnimation.playState==='running' && tickerAnimation.currentTime>time,paused);
    await page.locator('.home-hero h1').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>tickerAnimation.playState==='paused');
    const offscreenTime=await page.evaluate(()=>tickerAnimation.currentTime);
    await page.locator('.signal-ticker').scrollIntoViewIfNeeded();
    await page.waitForFunction(time=>tickerAnimation.playState==='running' && tickerAnimation.currentTime>=time,offscreenTime);
    assert.deepEqual(errors,[]);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.signal-ticker__track').evaluate(el=>getComputedStyle(el).animationName),'none');
    console.log('PASS ticker: seamless repeat boundaries, full coverage at 320–3840px in three languages, fixed speed, retained phase and pause/resume');
  } finally {await context.close();}
};
