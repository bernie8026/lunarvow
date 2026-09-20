const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/preloader.js'), 'utf8');
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
function setup(resources) {
  const requests = [], images = [], timers = new Map(), updates = [];
  let id = 0, manifestFails = false;
  const window = {};
  const context = { window, URL, AbortController, document: {currentScript:{src:'https://example.test/lunarvow/assets/preloader.js'}},
    setTimeout(fn) { timers.set(++id,fn); return id; }, clearTimeout(id) {timers.delete(id);},
    async fetch(url, options) {
      if (url.href.endsWith('preload-manifest.json')) {
        return {ok:!manifestFails,status:503,json:async()=>({resources})};
      }
      const body = deferred();
      const request = {url:url.href,body,options}; requests.push(request);
      options.signal.addEventListener('abort',()=>body.reject(new Error('aborted')));
      return {ok:true,arrayBuffer:()=>body.promise};
    },
    Image: class {
      constructor(){ images.push(this); this.decoded=deferred(); }
      decode(){return this.decoded.promise;}
    }
  };
  vm.runInNewContext(source, context);
  return {task:window.BHR_PRELOADER.create(value=>updates.push(value)), requests,images,timers,updates,
    setManifestFailure(value){manifestFails=value;}};
}
(async () => {
  const t=setup([{url:'index.html'},{url:'story.html'},{url:'music.mp3?v=7'},{url:'portrait.png',type:'image'}]);
  let ended=false; const done=t.task.run().then(value=>{ended=true;return value;}); await flush();
  assert.equal(t.requests.length,3); assert.equal(t.updates.at(-1).loaded,0,'headers do not count');
  t.requests[0].body.resolve(new ArrayBuffer(1)); t.requests[1].body.resolve(new ArrayBuffer(1));
  t.images[0].onload(); await flush();
  assert.equal(t.updates.at(-1).loaded,2,'image must finish decoding'); assert.equal(ended,false);
  t.images[0].decoded.resolve(); await flush(); assert.equal(t.updates.at(-1).loaded,3);
  t.requests[2].body.resolve(new ArrayBuffer(1)); assert.equal(await done,true);
  assert.equal(t.updates.at(-1).loaded,4); assert.equal(t.timers.size,0);
  assert.ok(t.requests.every(r=>r.url.startsWith('https://example.test/lunarvow/')));
  console.log('PASS preload: full bodies, image decode and Pages subpath');

  const failed=setup([{url:'good.css'},{url:'bad.json'}]); const first=failed.task.run(); await flush();
  failed.requests[0].body.resolve(); failed.requests[1].body.reject(new Error('network')); assert.equal(await first,false);
  assert.equal(failed.updates.at(-1).loaded,1); assert.equal(failed.updates.at(-1).failed[0],'bad.json');
  const retry=failed.task.run(); await flush(); assert.equal(failed.requests.length,3,'retry only failed request');
  failed.requests[2].body.resolve(); assert.equal(await retry,true);
  console.log('PASS preload: failed transfers never count, selective retry');

  const timeout=setup([{url:'stalled.mp3'}]);const waiting=timeout.task.run();await flush();
  [...timeout.timers.values()].forEach(fn=>fn());assert.equal(await waiting,false);assert.equal(timeout.updates.at(-1).loaded,0);
  const cancel=setup(Array.from({length:12},(_,i)=>({url:`${i}.html`}))); const canceled=cancel.task.run();await flush();
  assert.equal(cancel.requests.length,6,'bounded concurrency');cancel.task.cancel();assert.equal(await canceled,false);
  assert.equal(cancel.requests.length,6,'cancellation stops pending downloads');assert.equal(cancel.timers.size,0);
  console.log('PASS preload: timeout reports failure; skip cancels the queue');

  const imageFail=setup([{url:'bad.png',type:'image'}]);const decode=imageFail.task.run();await flush();
  imageFail.images[0].onload();imageFail.images[0].decoded.reject(new Error('decode'));assert.equal(await decode,false);
  const manifest=setup([{url:'style.css'}]);manifest.setManifestFailure(true);assert.equal(await manifest.task.run(),false);
  assert.equal(manifest.updates.at(-1).failed[0],'assets/preload-manifest.json');manifest.setManifestFailure(false);
  const again=manifest.task.run();await flush();manifest.requests[0].body.resolve();assert.equal(await again,true);
  console.log('PASS preload: invalid image and manifest recovery');

  const data=JSON.parse(fs.readFileSync(path.join(root,'assets/preload-manifest.json')));
  const urls=new Set(data.resources.map(r=>r.url));
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))) {
    assert.ok(urls.has(file),file+' covered');
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(html.indexOf('assets/preloader.js') < html.indexOf('src="site.js"'),file+' script order');
    assert.match(html,/assets\/preloader.js/);
  }
  for(const character of JSON.parse(fs.readFileSync(path.join(root,'data/characters.json')))) assert.ok(urls.has(character.image));
  assert.ok([...urls].some(url=>url.endsWith('.mp3?v=7')));
  assert.ok(urls.has('assets/endfield-ui.css'));
  const {buildManifest}=require('../scripts/build-preload-manifest.cjs');
  const rebuilt=buildManifest(data.resources.map(r=>r.url).filter(u=>!u.startsWith('https:')&&!u.includes('?')),
    JSON.parse(fs.readFileSync(path.join(root,'data/characters.json'))),fs.readFileSync(path.join(root,'assets/music-player.js'),'utf8'),fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'));
  assert.deepEqual(rebuilt,data);
  console.log('PASS preload: all subpages, external portraits, styles and versioned music in reproducible manifest');
})().catch(error=>{console.error(error);process.exitCode=1;});
