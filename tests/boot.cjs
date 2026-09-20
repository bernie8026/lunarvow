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
const lifecycle = extract('    if (bootScreen) {', '    if (menuToggle && menu) {');

function setup(options = {}) {
  let now = 0, id = 0, releases = 0;
  const timers = new Map();
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name, event = {}) { for (const fn of [...(this.listeners.get(name) || [])]) fn(event); }
  }
  class Element extends Target {
    constructor(tag = 'DIV') {
      super(); this.tagName = tag; this.inert = false; this.hidden = false; this.children = []; this.attributes = {};
      const classes = new Set();
      this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); child.parent = this; }
    querySelector() { return this.button ??= new Element('BUTTON'); }
    focus() { document.activeElement = this; }
    contains(element) { return element === this.button; }
    remove() { this.removed = true; this.parent.children = this.parent.children.filter(x => x !== this); }
  }
  const body = new Element('BODY'), header = new Element('HEADER'), main = new Element('MAIN');
  header.inert = !!options.preexistingInert;
  if (!options.inner) body.classList.add('home-page');
  body.appendChild(header); body.appendChild(main);
  const document = Object.assign(new Target(), {
    body, readyState: options.complete ? 'complete' : 'loading',
    createElement: tag => new Element(tag.toUpperCase()),
    getElementById: () => main
  });
  const window = Object.assign(new Target(), {
    location: { hash: options.hash || '' },
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay }); return key; },
    clearTimeout(key) { timers.delete(key); },
    requestAnimationFrame(fn) { return window.setTimeout(fn, 16); }
  });
  const reduceMotionQuery = Object.assign(new Target(), { matches: !!options.reduced });
  const context = vm.createContext({ body, document, window, reduceMotionQuery,
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
  return {screen, body, document, window, main, reduceMotionQuery, advance, usable, timers, get releases(){return releases;} };
}

const tests = {
  'normal loading waits for exit before releasing homepage motion': () => {
    const t = setup(); assert.equal(t.screen.hidden, false); assert.equal(t.main.inert, true);
    t.window.emit('load'); t.advance(999); assert.equal(t.releases, 0);
    t.advance(1); assert.equal(t.screen.classList.contains('is-hidden'), true); assert.equal(t.releases, 0);
    t.advance(550); t.usable(); assert.equal(t.document.activeElement, t.main);
    t.window.emit('load'); t.advance(4000); assert.equal(t.releases, 1); assert.equal(t.timers.size, 0);
  },
  'cached document still presents the intro': () => { const t = setup({complete:true}); t.advance(1550); t.usable(); },
  'stalled network releases content at the hard deadline': () => {
    const t = setup(); t.advance(3199); assert.equal(t.releases, 0); t.advance(1); t.usable();
    t.window.emit('load'); t.advance(4000); assert.equal(t.releases, 1);
  },
  'skip preserves existing inert state and clears timers': () => {
    const t = setup({preexistingInert:true}); t.screen.querySelector().emit('click'); t.usable(); assert.equal(t.timers.size, 0);
  },
  'keyboard skip and focus containment': () => {
    const t = setup(); let prevented = false;
    t.document.emit('keydown', {key:'Tab', preventDefault(){prevented = true;}});
    assert.ok(prevented); assert.equal(t.document.activeElement, t.screen.querySelector());
    t.document.emit('keydown', {key:'Escape', preventDefault(){}}); t.usable();
  },
  'reduced motion, inner pages, anchors and history skip the overlay': () => {
    for (const options of [{reduced:true},{inner:true},{hash:'#archive'},{history:true}]) {
      const t = setup(options); assert.equal(t.screen, null); t.advance(32); t.usable();
    }
  },
  'restored pages and a motion preference change cannot retain the overlay': () => {
    const a = setup(); a.window.emit('pageshow',{persisted:true}); a.usable();
    const b = setup(); b.reduceMotionQuery.emit('change',{matches:true}); b.usable();
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
for (const [name, test] of Object.entries(tests)) { test(); console.log('PASS boot:', name); }
