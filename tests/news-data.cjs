const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/news.json')));
const view=require('../assets/news-view.js');
const ids=new Set();
assert.equal(data.schemaVersion,1);
assert.match(data.checkedOn,/^\d{4}-\d{2}-\d{2}$/);
assert.ok(data.items.length>=20,'Complete current-version coverage');
for(const item of data.items) {
  assert.ok(!ids.has(item.id),'Unique announcement: '+item.id);ids.add(item.id);
  assert.ok(item.regions.length && item.regions.every(r=>['tw','global','cn'].includes(r)));
  assert.ok(['version','story','event','supply','equipment','outfit','media'].includes(item.category));
  assert.match(item.announcedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(item.announcedOn<=data.checkedOn,'No future publication: '+item.id);
  for(const lang of ['zh-HK','en','zh-CN']) assert.ok(item.content[lang]?.title && item.content[lang]?.summary);
  for(const source of item.sources) {
    const url=new URL(source.url);
    assert.equal(url.protocol,'https:');
    assert.ok(['www.taptap.cn','apps.apple.com','steamcommunity.com'].includes(url.hostname),'Audited official platform');
  }
  for(const key of ['startsAt','endsAt']) if(item[key]) {
    assert.ok(/(?:Z|[+-]\d{2}:\d{2})$/.test(item[key]),'Timed status needs an explicit zone');
    assert.ok(Number.isFinite(Date.parse(item[key])));
  }
  if(item.startsAt && item.endsAt) assert.ok(Date.parse(item.startsAt)<Date.parse(item.endsAt));
}
assert.ok(ids.has(data.spotlight));
for(const id of data.homeItems) assert.ok(ids.has(id));
const snapshot=Date.parse(data.checkedOn+'T12:00:00+08:00');
const lunar=view.select(data,{search:'月下'});
assert.ok(lunar.length>=3);
assert.ok(lunar.every(item=>item.regions.includes('cn')),'CN Lunar rewards are not TW/global news');
assert.equal(view.select(data,{search:'月下',region:'tw'}).length,0);
assert.equal(view.select(data,{search:'时序',category:'equipment'}).length,1,'Simplified search finds localized equipment');
assert.equal(view.select(data,{search:'lunar vow',category:'event'}).length,1);
assert.equal(view.select(data,{region:'tw'}).find(x=>x.category==='version').version,'9.0');
assert.equal(view.select(data,{region:'cn'}).find(x=>x.category==='version').version,'9.1');
const login=data.items.find(x=>x.id==='cn-luna-login');
assert.equal(view.status(login,Date.parse('2026-09-30T20:00:00Z')-1),'upcoming');
assert.equal(view.status(login,Date.parse('2026-09-30T20:00:00Z')),'active');
assert.equal(view.status(login,Date.parse('2026-11-25T20:00:00Z')),'ended');
assert.equal(view.status(data.items.find(x=>x.id==='global-senadina'),snapshot),'notice','Unknown global server zone must not be guessed');
const all=view.select(data);
assert.deepEqual(all.map(x=>x.announcedOn),all.map(x=>x.announcedOn).sort().reverse());
const forged={...login,content:{en:{title:'<script>alert(1)</script>',summary:'<img src=x onerror=alert(1)>',period:''}}};
assert.ok(!view.card(forged,'en',snapshot).includes('<script>'));
const html=fs.readFileSync(path.join(root,'news.html'),'utf8');
for(const item of data.items) assert.ok(html.includes('id="news-'+item.id+'"'),'No-JS announcement: '+item.id);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/preload-manifest.json')));
for(const url of ['news.html','data/news.json','assets/news-data.js','assets/news-view.js','assets/news.js','assets/news.css']) assert.ok(manifest.resources.some(r=>r.url===url),'Strictly preloaded: '+url);
console.log('PASS news data: official sources, region boundaries, all three languages, safe rendering, dates and status deadlines');
