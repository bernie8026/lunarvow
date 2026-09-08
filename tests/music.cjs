const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/music-player.js'), 'utf8');
class FakeElement extends EventTarget {
  constructor() { super(); this.dataset = {}; this.attributes = {}; this.textContent = ''; this.classList = { toggle() {} }; this.children = new Map(); }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector, new FakeElement()); return this.children.get(selector); }
  appendChild(child) { this.child = child; }
}
function setup({ volume = null, time = null, blockedStorage = false } = {}) {
  let instance;
  class FakeAudio extends EventTarget {
    constructor() { super(); instance = this; this.paused = true; this.currentTime = 0; this.duration = 120; this.readyState = 0; this.volume = 1; this.playCalls = 0; this.loadCalls = 0; this.pending = []; }
    play() { this.playCalls++; this.paused = false; return new Promise((resolve, reject) => this.pending.push({ resolve, reject })); }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    load() { this.loadCalls++; }
    succeed() { this.readyState = 4; this.dispatchEvent(new Event('playing')); this.pending.shift().resolve(); }
    fail(name) { this.paused = true; this.pending.shift().reject(Object.assign(new Error(name), { name })); }
  }
  const body = new FakeElement();
  const document = Object.assign(new EventTarget(), { body, documentElement: { lang: 'zh-HK' }, baseURI: 'https://example.com/', currentScript: { src: 'https://example.com/assets/music-player.js' }, querySelector() { return null; }, createElement() { return new FakeElement(); } });
  const window = new EventTarget();
  const storage = new Map([['bhr-lunar-music-volume-v7', volume], ['bhr-lunar-music-time-v7', time]]);
  const localStorage = { getItem(key) { if (blockedStorage) throw new Error('Storage blocked'); return storage.get(key); }, setItem(key, value) { if (blockedStorage) throw new Error('Storage blocked'); storage.set(key, value); } };
  vm.runInNewContext(source, { document, window, Audio: FakeAudio, URL, localStorage });
  const panel = body.child;
  const toggle = panel.querySelector('.music-console__toggle');
  const click = () => toggle.dispatchEvent(new Event('click'));
  return { audio: instance, panel, toggle, click, window, document, storage, status: panel.querySelector('.music-console__copy small'), volumeInput: panel.querySelector('.music-console__volume input') };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const consent = setup({ volume: '0', time: '25' });
  assert.equal(consent.audio.autoplay, false);
  assert.equal(consent.audio.preload, 'none');
  consent.document.dispatchEvent(new Event('pointerdown'));
  consent.document.dispatchEvent(new Event('keydown'));
  consent.audio.dispatchEvent(new Event('canplay'));
  assert.equal(consent.audio.playCalls, 0, 'page interactions and media readiness never start music');
  assert.equal(consent.audio.volume, 0, 'saved mute is retained');
  consent.window.dispatchEvent(new Event('pagehide'));
  assert.equal(consent.storage.get('bhr-lunar-music-time-v7'), '25', 'unplayed page does not erase saved position');
  consent.click();
  assert.equal(consent.audio.playCalls, 1);
  assert.equal(consent.toggle.attributes['aria-label'], '暫停背景音樂');
  consent.audio.readyState = 1;
  consent.audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(consent.audio.currentTime, 25);
  consent.audio.succeed();
  await flush();
  assert.match(consent.status.textContent, /播放中/);
  assert.equal(consent.audio.volume, 0, 'starting does not override mute');
  consent.audio.dispatchEvent(new Event('waiting'));
  assert.equal(consent.status.textContent, '正在載入音樂');
  consent.click();
  assert.equal(consent.audio.paused, true, 'buffering remains cancellable');
  consent.audio.dispatchEvent(new Event('canplay'));
  assert.equal(consent.audio.playCalls, 1, 'canplay does not resume paused music');
  const race = setup();
  race.click();
  race.click();
  race.audio.fail('AbortError');
  await flush();
  assert.equal(race.status.textContent, '按此播放', 'cancelled play rejection cannot overwrite stopped state');
  const fail = setup();
  fail.click();
  fail.audio.fail('NotAllowedError');
  await flush();
  assert.equal(fail.status.textContent, '請按播放重試');
  fail.document.dispatchEvent(new Event('pointerdown'));
  assert.equal(fail.audio.playCalls, 1, 'blocked playback still requires the play button');
  fail.click();
  fail.audio.fail('NotSupportedError');
  await flush();
  assert.equal(fail.status.textContent, '載入失敗 · 按此重試');
  fail.click();
  assert.equal(fail.audio.loadCalls, 1, 'error retry reloads audio');
  assert.equal(fail.audio.playCalls, 3, 'retry plays in the same click gesture');
  fail.audio.succeed();
  await flush();
  assert.match(fail.status.textContent, /播放中/);
  const privateMode = setup({ blockedStorage: true });
  privateMode.click();
  privateMode.audio.succeed();
  await flush();
  privateMode.volumeInput.value = '0.05';
  privateMode.volumeInput.dispatchEvent(new Event('input'));
  assert.equal(privateMode.audio.volume, 0.05);
  assert.equal(privateMode.volumeInput.attributes['aria-valuetext'], '5%');
  privateMode.window.dispatchEvent(new Event('pagehide'));
  assert.equal(privateMode.audio.paused, true);
  privateMode.document.body.dataset.language = 'en';
  privateMode.window.dispatchEvent(new Event('bhr:languagechange'));
  assert.equal(privateMode.toggle.attributes['aria-label'], 'Play background music');
  privateMode.document.body.dataset.language = 'zh-CN';
  privateMode.window.dispatchEvent(new Event('bhr:languagechange'));
  assert.equal(privateMode.toggle.attributes['aria-label'], '播放背景音乐');
  assert.equal(privateMode.panel.attributes.translate, 'no');
  console.log('Music regression checks passed: explicit consent, saved mute/position, buffering cancellation, rejected play races, retry, blocked storage, volume accessibility, and three languages.');
})().catch(error => { console.error(error); process.exitCode = 1; });
