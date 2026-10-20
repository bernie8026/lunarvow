'use strict';
const FORMAT = 'lunarvow-vault-v2';
const BUILD = '@@BUILD@@';
const ROOT = new URL(self.registration.scope);
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const publicFiles = new Set(['vault-sw.js', '_vault/config.json', '_vault/runtime.js', '_vault/gate.css', '_vault/session.css']);
let configPromise;
let session = null;
let recovering = null;
let epoch = 0;
let canRestore = true;
const decrypted = new Map();

const bytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const aad = name => encoder.encode(`${FORMAT}:${BUILD}:${name}`);
async function download(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(new URL(url, ROOT), { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('network');
    return await response.arrayBuffer();
  } finally { clearTimeout(timer); }
}
async function config() {
  if (!configPromise) configPromise = download('_vault/config.json').then(buffer => {
    const value = JSON.parse(decoder.decode(buffer));
    if (value.format !== FORMAT || value.build !== BUILD || value.compression !== 'gzip' || value.iterations !== 600000 ||
        !/^[A-Za-z0-9+/]{43}=$/.test(value.salt) || !/^[a-f0-9]{48}\.bin$/.test(value.archive?.file) ||
        !/^[A-Za-z0-9+/]{16}$/.test(value.archive?.iv)) throw new Error('changed');
    return value;
  }).catch(error => { configPromise = null; throw error; });
  return configPromise;
}
async function decrypt(key, record, name) {
  if (!/^[a-f0-9]{48}\.bin$/.test(record.file) || !/^[A-Za-z0-9+/]{16}$/.test(record.iv)) throw new Error('invalid');
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(record.iv), additionalData: aad(name) }, key,
    await download(`_vault/data/${record.file}`));
}
async function unlock(rawKey, build) {
  if (build !== BUILD || typeof rawKey !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(rawKey)) throw new Error('changed');
  const attempt = epoch;
  const settings = await config();
  const key = await crypto.subtle.importKey('raw', bytes(rawKey), 'AES-GCM', false, ['decrypt']);
  let index;
  try {
    const compressed = await decrypt(key, settings.archive, '@archive');
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    index = JSON.parse(await new Response(stream).text());
  }
  catch (error) { throw new Error(error.name === 'OperationError' ? 'password' : 'network'); }
  if (index.format !== FORMAT || index.build !== BUILD || !index.files?.['index.html'] || attempt !== epoch) throw new Error('locked');
  session = { key, files: index.files };
  canRestore = true;
  decrypted.clear();
}
function requestKey(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 1500);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close(); resolve(event.data);
    };
    client.postMessage({ type: 'VAULT_KEY_REQUEST', build: BUILD }, [channel.port2]);
  });
}
async function restoreSession() {
  if (session) return true;
  if (!canRestore) return false;
  if (!recovering) recovering = (async () => {
    const attempt = epoch;
    const clients = (await self.clients.matchAll({ type: 'window' })).filter(client => client.url.startsWith(ROOT.href));
    const candidates = await Promise.all(clients.map(requestKey));
    for (const candidate of candidates) {
      if (attempt !== epoch) return false;
      if (!candidate?.key || candidate.build !== BUILD) continue;
      try { await unlock(candidate.key, candidate.build); return true; } catch { /* Try another open tab. */ }
    }
    return false;
  })().finally(() => { recovering = null; });
  return recovering;
}
function headers(type, length) {
  return { 'Content-Type': type, 'Content-Length': String(length), 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
}
async function gate() {
  const contents = await download('index.html');
  return new Response(contents, { headers: headers('text/html; charset=utf-8', contents.byteLength) });
}
async function serve(request, name) {
  const authorized = await restoreSession();
  if (!authorized) return request.mode === 'navigate' ? gate() : new Response('Locked', { status: 403, headers: headers('text/plain', 6) });
  const current = session;
  const record = Object.hasOwn(current.files, name) && current.files[name];
  if (!record) return new Response('Not found', { status: 404, headers: headers('text/plain', 9) });
  if (!decrypted.has(name)) decrypted.set(name, Promise.resolve().then(() => {
    let body = bytes(record.body);
    if (body.byteLength !== record.bytes) throw new Error('invalid');
    if (name.endsWith('.html')) {
      let html = decoder.decode(body).replace(/<html\b/i, '<html data-vault-content data-vault-pending');
      const bootstrap = `<link rel="stylesheet" href="${ROOT.pathname}_vault/session.css"><script src="${ROOT.pathname}_vault/runtime.js" defer></script>`;
      html = html.replace(/<head\b[^>]*>/i, match => match + bootstrap);
      body = encoder.encode(html);
    }
    return body.buffer;
  }).catch(error => { decrypted.delete(name); throw error; }));
  const body = await decrypted.get(name);
  if (current !== session) return new Response('Locked', { status: 403, headers: headers('text/plain', 6) });
  const responseHeaders = headers(record.type, body.byteLength);
  responseHeaders['Accept-Ranges'] = 'bytes';
  if (request.method === 'HEAD') return new Response(null, { headers: responseHeaders });
  const range = request.headers.get('Range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const size = body.byteLength;
    let start = match?.[1] ? Number(match[1]) : 0;
    let end = match?.[2] ? Number(match[2]) : size - 1;
    if (match && !match[1] && match[2]) { start = Math.max(0, size - Number(match[2])); end = size - 1; }
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
      return new Response(null, { status: 416, headers: { ...responseHeaders, 'Content-Length': '0', 'Content-Range': `bytes */${size}` } });
    }
    end = Math.min(end, size - 1);
    const part = body.slice(start, end + 1);
    return new Response(part, { status: 206, headers: { ...responseHeaders, 'Content-Length': String(part.byteLength), 'Content-Range': `bytes ${start}-${end}/${size}` } });
  }
  return new Response(body, { headers: responseHeaders });
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (!event.source?.url?.startsWith(ROOT.href) || !event.ports[0]) return;
  event.waitUntil((async () => {
    const reply = value => event.ports[0].postMessage(value);
    try {
      if (event.data?.type === 'VAULT_UNLOCK') {
        await unlock(event.data.key, event.data.build);
        reply({ ok: true, build: BUILD });
      } else if (event.data?.type === 'VAULT_STATUS') {
        reply({ ok: await restoreSession(), build: BUILD });
      } else if (event.data?.type === 'VAULT_LOCK') {
        epoch++; session = null; canRestore = false; decrypted.clear();
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clients) if (client.url.startsWith(ROOT.href)) {
          client.postMessage({ type: 'VAULT_LOCKED' });
          // Built-in image/JSON viewers do not run the page's session bridge.
          const name = new URL(client.url).pathname.slice(ROOT.pathname.length);
          if (name && !name.endsWith('.html')) await client.navigate(client.url).catch(() => {});
        }
        reply({ ok: true });
      }
    } catch (error) { reply({ ok: false, error: error.message === 'password' ? 'password' : error.message === 'changed' ? 'changed' : 'network' }); }
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  let name;
  try { name = decodeURIComponent(url.pathname.slice(ROOT.pathname.length)) || 'index.html'; }
  catch { event.respondWith(new Response('Invalid path', { status: 400 })); return; }
  if (publicFiles.has(name) || /^_vault\/data\/[a-f0-9]{48}\.bin$/.test(name)) return;
  if (!['GET', 'HEAD'].includes(event.request.method)) { event.respondWith(new Response('Method not allowed', { status: 405 })); return; }
  event.respondWith(serve(event.request, name).catch(() => new Response('Encrypted resource unavailable', {
    status: 503, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }
  })));
});
