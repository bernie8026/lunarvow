(() => {
  'use strict';
  if (window.BHR_EXPRESSIVE) return;
  const body=document.body, reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const hero=document.querySelector('.home-hero'), figure=hero?.querySelector('.hero-figure');
  const compact=matchMedia('(max-width: 820px)');
  const heroInfo=hero?.querySelector('.hero-panel'), heroCopy=hero?.querySelector('.hero-copy');
  const orderHero=()=>{
    if(!figure || !heroInfo || !heroCopy) return;
    if(compact.matches) figure.after(heroInfo); else heroCopy.appendChild(heroInfo);
  };
  orderHero();
  compact.addEventListener('change',orderHero);
  const scenes=new Set(), awake=new Set(), wired=new WeakSet();
  let frame=0, paused=false, lastPointer={x:0,y:0};
  try { paused=localStorage.getItem('bhr-background-motion')==='paused'; } catch {}
  const control=document.createElement('button');
  control.type='button'; control.className='motion-control'; control.hidden=true;
  control.dataset.i18nIgnore=''; control.setAttribute('aria-pressed',String(paused));
  body.appendChild(control);
  const copy={
    'zh-HK':['暫停背景動態','繼續背景動態'],
    'zh-CN':['暂停背景动态','继续背景动态'],
    en:['Pause background motion','Resume background motion']
  };
  const label=()=>{
    const l=copy[window.BHR_I18N?.language || document.documentElement.lang] || copy['zh-HK'];
    control.textContent=l[paused?1:0]; control.setAttribute('aria-pressed',String(paused));
  };
  function mode() {
    for(const [name,value] of [['ambient-paused',paused || reduced.matches],['scene-hidden',document.hidden]]) {
      if(body.classList.contains(name)!==value) body.classList.toggle(name,value);
    }
    control.hidden=body.classList.contains('is-booting') || reduced.matches;
    label();
    if(!document.hidden) scheduleTicker();
    if (paused || reduced.matches || document.hidden) {
      cancelAnimationFrame(frame); frame=0;
    } else schedule();
  }
  const ticker=document.querySelector('.signal-ticker');
  const tickerTrack=ticker?.querySelector('.signal-ticker__track');
  const [tickerGroup,tickerCopy]=ticker?.querySelectorAll('.signal-ticker__group') || [];
  const tickerPattern=tickerGroup?.querySelector('.signal-ticker__segment');
  let tickerFrame=0, tickerKey='', tickerWidth=0;
  function fitTicker() {
    tickerFrame=0;
    if(!tickerPattern || !tickerCopy) return;
    const gap=parseFloat(getComputedStyle(tickerGroup).columnGap) || 0;
    const stride=tickerPattern.getBoundingClientRect().width+gap;
    if(stride<=0) return;
    const count=Math.max(1,Math.ceil(ticker.clientWidth/stride));
    const key=tickerPattern.textContent+'|'+count;
    const animation=tickerTrack.getAnimations().find(a=>a.animationName==='ticker');
    const previousDuration=Number(animation?.effect.getComputedTiming().duration) || 0;
    const phase=previousDuration ? Number(animation.currentTime || 0)%previousDuration : 0;
    if(key!==tickerKey) {
      const segments=[tickerPattern];
      for(let i=1;i<count;i++) {
        const segment=tickerPattern.cloneNode(true);
        segment.dataset.i18nIgnore=''; segments.push(segment);
      }
      tickerGroup.replaceChildren(...segments);
      tickerCopy.replaceChildren(...segments.map(segment=>segment.cloneNode(true)));
      tickerKey=key;
    }
    const width=tickerGroup.getBoundingClientRect().width;
    if(Math.abs(width-tickerWidth)>.01) {
      // A fixed pixel speed keeps the position when fonts, language or width change.
      const duration=width/48*1000;
      tickerTrack.style.setProperty('--ticker-duration',duration+'ms');
      const current=tickerTrack.getAnimations().find(a=>a.animationName==='ticker');
      if(current) current.currentTime=phase%duration;
      tickerWidth=width;
    }
    ticker.dataset.tickerReady='true';
  }
  function scheduleTicker() {
    if(ticker && !tickerFrame) tickerFrame=requestAnimationFrame(fitTicker);
  }
  if(tickerPattern) {
    if('ResizeObserver' in window) {
      const sizes=new ResizeObserver(scheduleTicker);
      sizes.observe(ticker); sizes.observe(tickerPattern);
    }
    addEventListener('resize',scheduleTicker,{passive:true});
    document.fonts?.ready.then(scheduleTicker);
  }
  if(figure) {
    const atmosphere=document.createElement('div');
    atmosphere.className='hero-atmosphere'; atmosphere.setAttribute('aria-hidden','true');
    atmosphere.innerHTML='<i class="hero-orbit"></i><i class="hero-orbit hero-orbit--inclined"></i><div class="hero-dust">'+
      Array.from({length:14},(_,i)=>'<i style="--x:'+((i*31+7)%92)+'%;--y:'+((i*17+11)%87)+'%;--duration:'+(9+i%5)+'s;--delay:'+(-i*.8)+'s"></i>').join('')+'</div>';
    figure.appendChild(atmosphere);
  }
  const quote=document.querySelector('.profile-statement');
  if(quote) {
    const signature=document.createElementNS('http://www.w3.org/2000/svg','svg');
    signature.setAttribute('viewBox','0 0 270 72'); signature.setAttribute('aria-hidden','true');
    signature.classList.add('profile-signature');
    signature.innerHTML='<path pathLength="1" d="M14 53 C25 25 37 14 43 19 C53 27 29 57 31 47 C35 35 59 25 60 37 C61 46 40 57 33 54 M37 36 C53 15 75 18 65 31 M66 49 C75 38 83 31 86 37 C89 44 66 53 72 44 C82 42 89 40 94 34 C99 26 100 34 96 40 C109 26 115 30 107 42 C117 35 121 30 128 30 C132 31 123 45 125 44 C139 27 142 26 138 36 C132 50 146 43 153 35 C160 26 151 23 150 31 C146 44 158 45 169 37 C180 28 176 26 173 33 C161 52 184 43 192 37 M32 63 C92 59 161 60 246 49"/>';
    quote.appendChild(signature);
  }
  function render() {
    frame=0;
    if(reduced.matches || paused || document.hidden || body.classList.contains('is-booting')) return;
    const height=innerHeight;
    for(const scene of awake) {
      if(!scene.isConnected) continue;
      const rect=scene.getBoundingClientRect();
      const progress=Math.min(1,Math.max(0,(height*.82-rect.top)/(rect.height+height*.3)));
      scene.style.setProperty('--read-progress',progress.toFixed(4));
    }
    if(hero && awake.has(hero) && fine.matches) {
      hero.style.setProperty('--scene-x',((lastPointer.x/innerWidth-.5)*14).toFixed(2)+'px');
      hero.style.setProperty('--scene-y',((lastPointer.y/innerHeight-.5)*10).toFixed(2)+'px');
    }
  }
  function schedule() {
    if(!frame && !paused && !reduced.matches && !document.hidden) frame=requestAnimationFrame(render);
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    for(const entry of entries) {
      entry.target.classList.toggle('scene-awake',entry.isIntersecting);
      if(entry.isIntersecting) awake.add(entry.target); else awake.delete(entry.target);
    }
    schedule();
  },{threshold:0,rootMargin:'50px 0px'}):null;
  function activate(card) {
    for(const other of card.parentElement.querySelectorAll('.archive-card')) other.classList.toggle('is-active',other===card);
  }
  function register(root) {
    const selector='.home-hero,.signal-ticker,.news-grid,.profile-statement,.story-timeline';
    const found=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
    for(const scene of found) {
      if(scenes.has(scene)) continue;
      scenes.add(scene);
      if(observer) observer.observe(scene); else {awake.add(scene);scene.classList.add('scene-awake');}
    }
    for(const card of root.querySelectorAll('.archive-card')) {
      if(wired.has(card)) continue; wired.add(card);
      card.addEventListener('pointerenter',()=>{if(fine.matches && !reduced.matches) activate(card);});
      card.addEventListener('focus',()=>activate(card));
    }
    const first=document.querySelector('.archive-card');
    if(first && !document.querySelector('.archive-card.is-active')) activate(first);
  }
  register(document);
  const content=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.addedNodes.length || m.removedNodes.length)) return;
    for(const scene of scenes) if(!scene.isConnected) {observer?.unobserve(scene); scenes.delete(scene);awake.delete(scene);}
    for(const m of mutations) for(const n of m.addedNodes) if(n instanceof Element) register(n);
    schedule();
  });
  content.observe(document.querySelector('main') || body,{subtree:true,childList:true});
  new MutationObserver(mode).observe(body,{attributes:true,attributeFilter:['class']});
  control.addEventListener('click',()=>{
    paused=!paused;
    try {localStorage.setItem('bhr-background-motion',paused?'paused':'playing');}catch{}
    mode();
  });
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pointermove',event=>{if(fine.matches){lastPointer={x:event.clientX,y:event.clientY};schedule();}},{passive:true});
  document.addEventListener('click',event=>{
    if(!event.target.closest('a[href]') || reduced.matches) return;
    body.style.setProperty('--exit-x',(event.clientX/innerWidth*100)+'%');
    body.style.setProperty('--exit-y',(event.clientY/innerHeight*100)+'%');
  });
  for(const event of ['bhr:languagechange','bhr:translationsready']) addEventListener(event,()=>{label();scheduleTicker();});
  document.addEventListener('visibilitychange',mode);
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;cancelAnimationFrame(tickerFrame);tickerFrame=0;body.classList.add('scene-hidden');});
  addEventListener('pageshow',mode);
  reduced.addEventListener('change',mode);
  window.BHR_EXPRESSIVE={get paused(){return paused;},get reduced(){return reduced.matches;}};
  mode();
})();
