const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const characters = JSON.parse(fs.readFileSync(path.join(root, 'data/characters.json')));
// Independently checked roster totals, including augment forms but excluding APHO.
const expected = {
  'kiana-kaslana':9, 'raiden-mei':9, 'bronya-zaychik':11, 'himeko-murata':6,
  'yae-sakura':4, 'theresa-apocalypse':9, 'fu-hua':8, 'kallen-kaslana':3,
  'rita-rossweisse':6, 'seele-vollerei':5, 'liliya-olenyeva':1, 'rozaliya-olenyeva':2,
  durandal:5, asuka:1, fischl:1, elysia:3, 'natasha-cioara':1, mobius:1,
  'carole-pepper':1, pardofelis:1, aponia:1, eden:1, griseo:2, 'vill-v':1,
  'li-sushang':2, 'ai-hyperion':1, susannah:1, prometheus:1, 'misteln-schariac':1,
  'shigure-kira':1, sirin:1, senadina:1, 'erdos-helia':2, 'coralie-planck':2,
  'thelema-nutriscu':1, lantern:1, songque:1, vita:1, sparkle:1, dreamseeker:1,
  'timido-cute':0
};
assert.deepEqual(characters.map(c=>c.slug).sort(), Object.keys(expected).sort());
const ids = new Set(), images = new Set();
for (const character of characters) {
  assert.ok(character.en && character.zh);
  assert.equal(character.battlesuits.filter(s=>s.kind !== 'apho').length, expected[character.slug], character.en);
  const primary = character.battlesuits.find(s=>s.slug === character.default_suit);
  assert.ok(primary, 'default exists: ' + character.en);
  assert.equal(character.image, primary.image);
  for (const suit of character.battlesuits) {
    assert.ok(!ids.has(suit.slug), 'unique suit: ' + suit.slug); ids.add(suit.slug);
    assert.ok(suit.en && suit.zh);
    assert.ok(['battlesuit','augment','apho'].includes(suit.kind));
    assert.ok(['main','captainverse','collab','part2','apho','previous-era','sirin','sentience','veliona'].includes(suit.variant));
    assert.ok(suit.image.startsWith('assets/hi3/'));
    assert.ok(fs.statSync(path.join(root, suit.image)).size > 1000);
    assert.equal(new URL(suit.source).protocol, 'https:');
    assert.equal(new URL(suit.entry_source).protocol, 'https:');
    if (suit.kind === 'augment') {
      const parent = character.battlesuits.find(s=>s.slug === suit.augment_of);
      assert.ok(parent && parent.kind === 'battlesuit', 'augment parent: ' + suit.en);
    }
    images.add(suit.image);
  }
}
const suits = characters.flatMap(c=>c.battlesuits);
assert.equal(suits.length, 115);
assert.equal(suits.filter(s=>s.kind === 'augment').length, 7);
assert.equal(suits.filter(s=>s.kind === 'apho').length, 4);
assert.equal(suits.filter(s=>s.variant === 'collab').length, 3);
assert.equal(images.size, 112);
const luna = characters.find(c=>c.slug === 'theresa-apocalypse');
assert.equal(luna.battlesuits.find(s=>s.en === 'Lunar Vow: Crimson Love').zh, '月下誓約・予愛以心');
assert.equal(characters.find(c=>c.slug === 'dreamseeker').battlesuits[0].version, 'CN 9.1');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/preload-manifest.json')));
for (const image of images) assert.ok(manifest.resources.some(r=>r.url === image && r.type === 'image'), 'preloaded: ' + image);
console.log('PASS valkyrie data: 41 families, 111 battlesuits/augments, 4 APHO entries, 112 local portraits, valid augment parents and sources');
