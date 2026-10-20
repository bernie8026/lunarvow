const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const {buildVault}=require('../scripts/build-vault.cjs');
const {fixture,PASSWORD,run}=require('./vault-unit.cjs');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json'};
async function gate(page){await page.locator('[data-vault-gate]').waitFor();await page.waitForFunction(()=>{const b=document.querySelector('[data-vault-submit]');return b&&!b.disabled;});}
async function unlocked(page){await page.locator('[data-vault-content]').waitFor({state:'attached'});await page.waitForFunction(()=>document.readyState==='complete'&&window.BHR_I18N&&!document.documentElement.hasAttribute('data-vault-pending'));}
async function unlock(page){await gate(page);await page.locator('[data-vault-password]').fill(PASSWORD);await page.locator('[data-vault-submit]').click();await unlocked(page);}
(async()=>{
  run();const {root}=fixture();const built=buildVault({root,password:PASSWORD,output:path.join(root,'.encrypted-dist')});
  let damaged=false,browser;const requests=[];
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');requests.push(url.href);
    if(!url.pathname.startsWith('/lunarvow/')){res.writeHead(404);res.end();return;}
    let name;try{name=decodeURIComponent(url.pathname.slice('/lunarvow/'.length))||'index.html';}catch{res.writeHead(400);res.end();return;}
    const file=path.resolve(built.output,name);
    if(!file.startsWith(built.output+path.sep)){res.writeHead(404);res.end();return;}
    fs.readFile(file,(error,body)=>{
      if(error){res.writeHead(404);res.end('Not found');return;}
      if(damaged&&name===`_vault/data/${built.config.archive.file}`){body=Buffer.from(body);body[0]^=1;}
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/lunarvow/`;
  try{
    for(const file of ['site.js','style.css','assets/photo.svg','assets/audio.mp3','data/characters.json','source-notes.md'])assert.equal((await fetch(base+file)).status,404);
    browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await gate(page);
    for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    await page.locator('[data-vault-language="en"]').click();assert.equal(await page.locator('h1').textContent(),'An archive under seal');
    await page.locator('[data-vault-language="zh-HK"]').click();
    assert.equal(await page.evaluate(async()=> (await fetch('data/characters.json')).status),403);
    await page.locator('[data-vault-password]').fill(PASSWORD+'-wrong');await page.locator('[data-vault-submit]').click();
    await page.waitForFunction(()=>document.querySelector('[data-vault-status]').classList.contains('is-error'));
    assert.equal(await page.locator('[data-vault-content]').count(),0);await unlock(page);
    assert.match(await page.locator('#main-content').textContent(),/PRIVATE_LUNAR_CONTENT/);
    const raw=await page.evaluate(async()=>({json:await(await fetch('data/characters.json')).json(),cache:await caches.keys(),headers:(await fetch('site.js')).headers.get('cache-control'),storage:JSON.stringify({...localStorage,...sessionStorage})}));
    assert.deepEqual(raw.json,[{private:'character'}]);assert.deepEqual(raw.cache,[]);assert.equal(raw.headers,'no-store');assert(!raw.storage.includes(PASSWORD));
    const range=await page.evaluate(async()=>{const r=await fetch('assets/audio.mp3?v=7',{headers:{Range:'bytes=2-7'}});return {status:r.status,length:(await r.arrayBuffer()).byteLength};});assert.deepEqual(range,{status:206,length:6});
    await page.goto(base+'guide.html');await unlocked(page);assert.match(await page.locator('#main-content').textContent(),/PRIVATE_GUIDE/);
    const devtools=await context.newCDPSession(page);await devtools.send('ServiceWorker.enable');await devtools.send('ServiceWorker.stopAllWorkers');
    assert.equal(await page.evaluate(async()=> (await(await fetch('data/characters.json')).json()).length),1);await devtools.detach();
    const other=await context.newPage();await other.goto(base);await unlocked(other);
    await page.locator('.vault-session-lock').click();await gate(page);await gate(other);
    await page.evaluate(()=>history.back());await page.waitForURL(base);await gate(page);
    assert.equal(await page.evaluate(async()=> (await fetch('data/characters.json')).status),403);
    assert.deepEqual(errors,[]);assert(!requests.some(r=>r.includes(PASSWORD)));await context.close();
    const restricted=await browser.newContext();await restricted.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
    const restrictedPage=await restricted.newPage();await restrictedPage.goto(base);await unlock(restrictedPage);await restrictedPage.locator('.vault-session-lock').click();await gate(restrictedPage);await restricted.close();
    const corrupt=await browser.newContext(),corruptPage=await corrupt.newPage();await corruptPage.goto(base);await gate(corruptPage);damaged=true;
    await corruptPage.locator('[data-vault-password]').fill(PASSWORD);await corruptPage.locator('[data-vault-submit]').click();await corruptPage.waitForFunction(()=>document.querySelector('[data-vault-status]').classList.contains('is-error'));
    assert.equal(await corruptPage.locator('[data-vault-content]').count(),0);damaged=false;await corrupt.close();
    const noJS=await browser.newContext({javaScriptEnabled:false}),disabled=await noJS.newPage();await disabled.goto(base+'guide.html');assert(await disabled.locator('noscript').isVisible());assert.equal(await disabled.locator('[data-vault-content]').count(),0);await noJS.close();
    console.log('PASS public encrypted runtime: gate, languages, wrong password, assets, range, navigation, worker restart, multi-tab lock, Back, blocked storage, tampering and no JavaScript');
  }finally{await browser?.close();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
