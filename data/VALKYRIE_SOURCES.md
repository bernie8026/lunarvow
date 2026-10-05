# Valkyrie archive coverage

Checked 2026-10-05. The archive contains 41 character groups and 115 files:
104 regular battlesuits, 7 augment forms and 4 playable APHO character entries.
CN 9.1's Dreamseeker / Herrscher of Time is included with a regional release label.
Collaboration units remain searchable even when their original acquisition event has ended.

## Roster references

- [Battlesuit roster](https://honkaiimpact3.fandom.com/wiki/Battlesuits): character and battlesuit grouping through Wings of Panacea.
- [Official character directory](https://bh3.mihoyo.com/gl/character/list): Chinese character names and current roster.
- [Official CN Steam announcements](https://steamcommunity.com/app/1668940/allnews/): CN 9.1, released 2026-09-24, and 時序之律者.
- [APHO](https://honkaiimpact3.fandom.com/wiki/A_Post-Honkai_Odyssey): Mei and Carole.
- [APHO 2](https://honkaiimpact3.fandom.com/wiki/A_Post-Honkai_Odyssey_2): Bronya and Timido.
- Every file also has its own `entry_source` link in `characters.json`.

## Grouping and identity

Groups are navigation families. Captainverse counterparts (Luna, Kongming, Bronie,
Kasumi, Irene, Delta and others) are labelled independently within the family.
Previous Era SAKURA, the Herrscher of Sentience and Seele's other personality have
their own identity labels. An augment's `augment_of` points to its base battlesuit.
APHO entries use `kind: "apho"` and do not count toward the 111 battlesuit / augment total.

## Image credits

All character names and game artwork belong to miHoYo / HoYoverse and their
respective collaboration rights holders. This is an unofficial personal archive.
Images are local files; the original image-page links remain attached to each entry.

- 21 existing portraits: [WaffleToast1814/Honkai-Impact-3rd-Website](https://github.com/WaffleToast1814/Honkai-Impact-3rd-Website/tree/a0833e72e96e1d1180d3530acf146605730e4d48), pinned snapshot.
- 90 new battlesuit portraits: [johnhonkai/testpls](https://github.com/johnhonkai/testpls/tree/ed9a6dc03066afe7bbf0163bf64204236a1724ac/static/images/valkportrait), pinned snapshot, converted to WebP without cropping.
- Timido: `Playable-Character-Image-Folder/Timido.png` in the pinned WaffleToast1814 snapshot.
- APHO Mei, Carole and Bronya use explicitly labelled representative portraits from their respective character files. Their APHO records do not claim those portraits depict a separate APHO battlesuit.

To add a new release, append a battlesuit to its character, record its Chinese and
English names, identity/category, source links and local image. Rebuild the preload
manifest and update the independently maintained roster expectations in the tests.
