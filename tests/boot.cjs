const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../site.js'), 'utf8');
const extract = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, 'boot lifecycle boundaries exist');
  return source.slice(a, b);
};
const creation = extract('    const createBootScreen =', '    const header =');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const lifecycle = extract('    if (bootScreen) {', '    if (menuToggle && menu) {');

function setup(options = {}) {
  let now = 0, id = 0, releases = 0, cancels = 0, report, resolveRun;
  const timers = new Map();
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name, event = {}) { for (const fn of [...(this.listeners.get(name) || [])]) fn(event); }
  }
  class Element extends Target {
    constructor(tag = 'DIV') {
      super(); this.tagName = tag; this.inert = false; this.hidden = false; this.children = []; this.attributes = {}; this.style = {}; this.nodes = new Map(); this.firstElementChild = {style:{}};
      const classes = new Set();
      this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); child.parent = this; }
    querySelector(selector) { if (!this.nodes.has(selector)) this.nodes.set(selector,new Element(selector.includes('skip') || selector.includes('retry') ? 'BUTTON' : 'DIV')); return this.nodes.get(selector); }
    replaceChildren(...nodes) { this.children = nodes; }
    focus() { document.activeElement = this; }
    contains(element) { return [...this.nodes.values()].includes(element); }
    remove() { this.removed = true; this.parent.children = this.parent.children.filter(x => x !== this); }
  }
  const body = new Element('BODY'), header = new Element('HEADER'), main = new Element('MAIN');
  header.inert = !!options.preexistingInert;
  if (!options.inner) body.classList.add('home-page');
  body.appendChild(header); body.appendChild(main);
  const document = Object.assign(new Target(), {
    body, documentElement: {lang:'en'}, fonts: {ready:options.fonts || Promise.resolve()}, readyState: options.complete ? 'complete' : 'loading',
    createElement: tag => new Element(tag.toUpperCase()),
    getElementById: () => main
  });
  const window = Object.assign(new Target(), {
    BHR_PRELOADER: {create(callback) { report = callback; return {run:()=>new Promise(resolve=>{resolveRun=resolve;report({loaded:0,total:2,failed:[],running:true});}), cancel(){cancels++;}};}},
    location: { hash: options.hash || '' },
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay }); return key; },
    clearTimeout(key) { timers.delete(key); },
    requestAnimationFrame(fn) { return window.setTimeout(fn, 16); }
  });
  const reduceMotionQuery = Object.assign(new Target(), { matches: !!options.reduced });
  const context = vm.createContext({ body, document, window, reduceMotionQuery, localStorage:{getItem:()=>null},
    performance: { now: () => now, getEntriesByType: () => [{type:options.history ? 'back_forward' : 'navigate'}] },
    startQueuedMotion: () => releases++
  });
  vm.runInContext(creation + lifecycle, context);
  const screen = vm.runInContext('bootScreen', context);
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  }
  function usable() {
    assert.ok(!screen || screen.removed);
    assert.equal(body.classList.contains('is-booting'), false);
    assert.equal(main.inert, false);
    assert.equal(header.inert, !!options.preexistingInert);
    assert.equal(releases, 1);
  }
  return {screen, body, document, window, main, reduceMotionQuery, advance, usable, timers, get releases(){return releases;}, get cancels(){return cancels;}, result(ok){report({loaded:ok?2:1,total:2,failed:ok?[]:['bad.png'],running:false});resolveRun(ok);} };
}

const tests = {
  'font readiness delays completion after the document and resources': async () => {
    let ready;
    const fonts = new Promise(resolve => { ready = resolve; });
    const t = setup({complete:true,fonts});
    t.result(true); await flush(); t.advance(10000); assert.equal(t.releases,0);
    ready(); await flush(); t.advance(550); t.usable();
  },
  'slow full-site downloads never finish at the old deadline': async () => {
    const t=setup();t.window.emit('load');await flush();t.advance(600000);assert.equal(t.releases,0);
    assert.equal(t.main.inert,true);t.result(true);await flush();t.advance(549);assert.equal(t.releases,0);
    t.advance(1);t.usable();assert.equal(t.cancels,1);assert.equal(t.document.activeElement,t.main);
  },
  'resource completion also waits for the current document': async () => {
    const t=setup();t.result(true);await flush();t.advance(10000);assert.equal(t.releases,0);
    assert.equal(t.screen.querySelector('.boot-screen__bar').attributes['aria-valuenow'],'99');
    t.window.emit('load');await flush();t.advance(550);t.usable();
  },
  'failure remains visible and retry waits for success': async () => {
    const t=setup({complete:true});t.result(false);await flush();t.advance(600000);assert.equal(t.releases,0);
    const retry=t.screen.querySelector('.boot-screen__retry');assert.equal(retry.hidden,false);
    assert.equal(t.screen.querySelector('.boot-screen__bar').attributes['aria-valuenow'],'50');
    retry.emit('click');t.result(true);await flush();t.advance(550);t.usable();
  },
  'skip cancels requests and restores existing inert state exactly once': async () => {
    const t=setup({preexistingInert:true});t.screen.querySelector('.boot-screen__skip').emit('click');t.usable();
    t.result(true);await flush();t.advance(10000);assert.equal(t.releases,1);assert.equal(t.timers.size,0);
  },
  'keyboard focus cycles through retry and skip': async () => {
    const t=setup();t.result(false);await flush();let prevented=false;
    t.document.emit('keydown',{key:'Tab',preventDefault(){prevented=true;}});
    assert.ok(prevented);assert.equal(t.document.activeElement,t.screen.querySelector('.boot-screen__retry'));
    t.document.emit('keydown',{key:'Escape',preventDefault(){}});t.usable();
  },
  'reduced motion, inner pages, anchors and history still wait for resources': async () => {
    for(const options of [{reduced:true},{inner:true},{hash:'#archive'},{history:true}]) {
      const t=setup({...options,complete:true});assert.ok(t.screen);await flush();t.advance(10000);assert.equal(t.releases,0);
      t.result(true);await flush();t.advance(options.reduced?0:550);t.usable();
    }
  },
  'BFCache restore cleans up; reduced motion does not bypass downloads': async () => {
    const a=setup();a.window.emit('pageshow',{persisted:true});a.usable();
    const b=setup();b.reduceMotionQuery.emit('change',{matches:true});assert.equal(b.releases,0);
    b.screen.querySelector('.boot-screen__skip').emit('click');b.usable();
  },
  'cached character reveals wait for boot completion': () => {
    const image = {style:{},dataset:{},matches:()=>true}; const state = {};
    const imageMotionStates = new WeakMap([[image,state]]), pendingCharacterReveals = new Map();
    const context = vm.createContext({image, state, imageMotionStates, pendingCharacterReveals,
      motionCanPlay:false, reduceMotionQuery:{matches:false}});
    vm.runInContext(extract('    const finishCharacterReveal =', '    const prepareCharacterImage ='), context);
    vm.runInContext('finishCharacterReveal(image, state)',context);
    assert.equal(pendingCharacterReveals.get(image),state); assert.equal(image.dataset.imageState,undefined);
    vm.runInContext('motionCanPlay = true; finishCharacterReveal(image, state)',context);
    assert.equal(pendingCharacterReveals.size,0); assert.equal(image.dataset.imageState,'ready'); assert.equal(image.style.opacity,'1');
  },
  'no-JS homepage contains no blocking overlay': () => {
    const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
    assert.doesNotMatch(html, /class="boot-screen"/);
    assert.match(html, /id="main-content" tabindex="-1"/);
  }
};
(async()=>{for (const [name, test] of Object.entries(tests)) { await test(); console.log('PASS boot:', name); }})().catch(error=>{console.error(error);process.exitCode=1;});
