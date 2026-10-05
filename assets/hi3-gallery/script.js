(() => {
  'use strict';
  const JSON_URL = document.currentScript?.dataset.json || 'data/characters.json';
  const languages = {
    'zh-HK': {
      placeholder: '輸入角色、裝甲或分支名稱…', search: '搜尋角色或戰衣',
      loading: '正在載入女武神檔案…', offline: '資料庫離線 // 無法載入角色資料',
      empty: '沒有相符檔案 // 試試其他角色或裝甲名稱', noRecords: '暫時未有角色檔案',
      retry: '重新載入', clear: '清除篩選', close: '關閉檔案', source: '圖片來源 ↗', reference: '裝甲／玩法資料 ↗',
      allCharacters: '所有角色', characterFilter: '角色', categoryFilter: '檔案分類', all: '所有分類',
      battlesuit: '一般裝甲', augment: '增幅核心', captainverse: '艦長線', collab: '聯動角色',
      part2: '第二部', apho: '後崩壞書', main: '角色裝甲', 'previous-era': '前文明 SAKURA',
      sentience: '識之律者・獨立人格', veliona: '「希兒」・另一人格', sirin: '西琳律者人格',
      heading: '女武神檔案', description: '按角色整理全部裝甲、增幅核心同分支。可以搜尋角色或裝甲名稱，開啟檔案後再切換各個形態；艦長線、聯動同後崩壞書會獨立標示。',
      visual: '角色檔案', imageError: '暫時無法載入圖片', branches: count => count + ' 個分支',
      open: name => '開啟 ' + name + ' 女武神檔案', count: (n, total, suits) => '顯示 ' + n + ' / ' + total + ' 個角色檔案・' + suits + ' 個相符分支',
      summary: (n, suits) => n + ' 個角色群組 / ' + suits + ' 個裝甲及玩法檔案',
      augmentOf: name => '增幅自：' + name, representative: name => '角色代表圖片：' + name,
      captainNote: '艦長宇宙同位角色／分支，與主線角色分開標示。',
      aphoNote: '後崩壞書專用可操作角色，使用該模式的技能與成長系統。',
      cnVersion: version => '陸服 ' + version.replace('CN ', '') + ' 已推出・各區更新進度可能不同'
    },
    en: {
      placeholder: 'Enter a character, battlesuit or variant…', search: 'Search characters or battlesuits',
      loading: 'Loading Valkyrie files…', offline: 'DATABASE OFFLINE // Unable to load character data',
      empty: 'NO MATCHING FILE // Try another character or battlesuit name', noRecords: 'No character files available yet',
      retry: 'RETRY', clear: 'CLEAR FILTERS', close: 'CLOSE FILE', source: 'IMAGE SOURCE ↗', reference: 'BATTLESUIT / MODE DETAILS ↗',
      allCharacters: 'All characters', characterFilter: 'Character', categoryFilter: 'File category', all: 'All categories',
      battlesuit: 'Battlesuits', augment: 'Augment cores', captainverse: 'Captainverse', collab: 'Collaborations',
      part2: 'Part 2', apho: 'A Post-Honkai Odyssey', main: 'Battlesuit', 'previous-era': 'Previous Era SAKURA',
      sentience: 'Herrscher of Sentience · distinct identity', veliona: 'Veliona · other personality', sirin: 'Sirin · Herrscher persona',
      heading: 'Valkyrie Files', description: 'Every battlesuit, augment core and variant, grouped by character. Search a character or battlesuit and open their file to switch forms. Captainverse, collaborations and APHO entries are labelled separately.',
      visual: 'CHARACTER FILE', imageError: 'Image currently unavailable', branches: count => count + ' variants',
      open: name => 'Open Valkyrie file of ' + name, count: (n, total, suits) => 'Showing ' + n + ' of ' + total + ' character files · ' + suits + ' matching variants',
      summary: (n, suits) => n + ' character groups / ' + suits + ' battlesuit and mode files',
      augmentOf: name => 'Augment of: ' + name, representative: name => 'Representative character image: ' + name,
      captainNote: 'Captainverse counterpart or variant, labelled separately from the main story character.',
      aphoNote: 'Playable in A Post-Honkai Odyssey, with the mode’s own skills and progression.',
      cnVersion: version => 'Released in ' + version + ' · regional schedules may differ'
    }
  };
  const language = () => window.BHR_I18N?.language || document.body.dataset.language || 'zh-HK';
  const simplify = value => window.BHR_I18N?.translate(value, 'zh-CN') || value;
  const copy = () => {
    if (language() !== 'zh-CN') return languages[language()] || languages['zh-HK'];
    return Object.fromEntries(Object.entries(languages['zh-HK']).map(([key, value]) => [key,
      typeof value === 'function' ? (...args) => simplify(value(...args)) : simplify(value)]));
  };
  const nameOf = entry => language() === 'en' ? entry.en : language() === 'zh-CN' ? simplify(entry.zh || entry.en) : entry.zh || entry.en;
  const normalize = value => String(value || '').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g, '').replace(/[\s\p{P}\p{S}]+/gu, '');
  const indexOf = text => normalize(text + ' ' + simplify(text));
  const setImage = (image, suit) => {
    image.alt = nameOf(suit);
    if (image.getAttribute('src') !== suit.image) image.src = suit.image;
  };

  let lightbox, lightboxTrigger, openCharacter, openSuit;
  const renderFile = () => {
    if (!openCharacter || !openSuit || !lightbox) return;
    const c = copy(), suit = openSuit;
    lightbox.querySelector('#lb-caption').textContent = nameOf(openCharacter);
    lightbox.querySelector('#lb-battlesuit').textContent = nameOf(suit);
    lightbox.querySelector('.lb-kicker').textContent = c.visual;
    lightbox.querySelector('.lb-close').textContent = c.close;
    lightbox.querySelector('#lb-kind').textContent = [c[suit.kind], suit.variant !== 'main' && suit.variant !== 'apho' && c[suit.variant]].filter(Boolean).join(' / ');
    lightbox.querySelector('#lb-branches-label').textContent = c.branches(openCharacter.battlesuits.length);
    const notes = [];
    if (suit.augment_of) {
      const parent = openCharacter.battlesuits.find(s => s.slug === suit.augment_of);
      if (parent) notes.push(c.augmentOf(nameOf(parent)));
    }
    if (suit.variant === 'captainverse') notes.push(c.captainNote);
    if (suit.kind === 'apho') notes.push(c.aphoNote);
    if (suit.version) notes.push(c.cnVersion(suit.version));
    const note = lightbox.querySelector('#lb-note');
    note.textContent = notes.join(' ');
    note.hidden = !notes.length;
    const label = lightbox.querySelector('#lb-image-label');
    label.textContent = suit.image_label ? c.representative(nameOf(suit.image_label)) : '';
    label.hidden = !suit.image_label;
    setImage(lightbox.querySelector('.lb-img'), suit);
    for (const [id, url, text] of [['lb-source', suit.source, c.source], ['lb-reference', suit.entry_source, c.reference]]) {
      const link = lightbox.querySelector('#' + id);
      link.textContent = text; link.hidden = !url;
      if (url) link.href = url;
    }
    lightbox.querySelector('.lb-image-error').textContent = c.imageError;
    lightbox.querySelectorAll('.suit-button').forEach(button => {
      const entry = openCharacter.battlesuits.find(s => s.slug === button.dataset.suit);
      button.setAttribute('aria-pressed', String(entry === suit));
      button.querySelector('strong').textContent = nameOf(entry);
      button.querySelector('small').textContent = entry.kind === 'augment' ? c.augment : c[entry.variant] || c.battlesuit;
    });
  };

  const ensureLightbox = () => {
    if (lightbox) return lightbox;
    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox valkyrie-file';
    lightbox.dataset.i18nIgnore = '';
    lightbox.setAttribute('aria-labelledby', 'lb-caption');
    lightbox.setAttribute('aria-describedby', 'lb-battlesuit');
    lightbox.innerHTML = '<header class="lb-header"><div><span class="lb-kicker"></span><h2 id="lb-caption"></h2></div><button class="lb-close" type="button" autofocus></button></header>' +
      '<div class="lb-shell"><div class="lb-visual"><img class="lb-img character-visual" alt=""><p class="lb-image-error" role="status" hidden></p><p id="lb-image-label" hidden></p></div>' +
      '<div class="lb-panel"><div class="suit-detail"><p id="lb-kind"></p><h3 id="lb-battlesuit"></h3><p id="lb-note" hidden></p>' +
      '<div class="lb-links"><a id="lb-source" target="_blank" rel="noopener noreferrer"></a><a id="lb-reference" target="_blank" rel="noopener noreferrer"></a></div></div>' +
      '<h4 id="lb-branches-label"></h4><div class="suit-list" role="group" aria-labelledby="lb-branches-label"></div></div></div>';
    document.body.appendChild(lightbox);
    const image = lightbox.querySelector('.lb-img'), error = lightbox.querySelector('.lb-image-error');
    image.addEventListener('error', () => { error.hidden = false; });
    image.addEventListener('load', () => { error.hidden = true; });
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('close', () => {
      document.body.classList.remove('gallery-dialog-open');
      if (lightboxTrigger?.isConnected && !lightboxTrigger.hidden) lightboxTrigger.focus({preventScroll:true});
    });
    return lightbox;
  };
  const openFile = (character, trigger) => {
    const dialog = ensureLightbox();
    openCharacter = character;
    openSuit = character._selected;
    lightboxTrigger = trigger;
    const list = dialog.querySelector('.suit-list');
    list.replaceChildren(...character.battlesuits.map(suit => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'suit-button'; button.dataset.suit = suit.slug;
      const img = document.createElement('img'); img.src = suit.image; img.alt = ''; img.decoding = 'async';
      const text = document.createElement('span'); text.append(document.createElement('strong'), document.createElement('small'));
      button.append(img, text);
      button.addEventListener('click', () => { openSuit = suit; renderFile(); });
      return button;
    }));
    renderFile();
    dialog.showModal();
    dialog.querySelector('.lb-shell').scrollTop = 0;
    document.body.classList.add('gallery-dialog-open');
    dialog.querySelector('.lb-close').focus({preventScroll:true});
  };
  const createCard = character => {
    const card = document.createElement('article');
    card.className = 'card'; card.tabIndex = 0; card.dataset.character = character.slug; card.dataset.i18nIgnore = '';
    card.setAttribute('role', 'button'); card.setAttribute('aria-haspopup', 'dialog');
    const image = document.createElement('img'); image.className = 'thumb character-visual'; image.loading = 'lazy'; image.decoding = 'async';
    const meta = document.createElement('div'); meta.className = 'meta';
    for (const className of ['name','tag','branch-count']) { const item = document.createElement('div'); item.className = className; meta.append(item); }
    card.append(image, meta);
    card.addEventListener('click', () => openFile(character, card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFile(character, card); }
    });
    return card;
  };

  const load = async () => {
    const grid = document.querySelector('#grid'), input = document.querySelector('#search');
    const status = document.querySelector('#search-status'), clear = document.querySelector('#clear-search');
    const characterFilter = document.querySelector('#character-filter'), categoryFilter = document.querySelector('#category-filter');
    if (!grid || !input || !status || !clear || !characterFilter || !categoryFilter) return;
    let characters = [], state = 'loading', statePanel;
    const categoryMatches = suit => {
      const category = categoryFilter.value;
      return category === 'all' || (['battlesuit','augment','apho'].includes(category) ? suit.kind === category : suit.variant === category);
    };
    const updateIndex = () => characters.forEach(character => {
      character._search = indexOf([character.en, character.zh, character.slug, ...(character.aliases || [])].join(' '));
      character.battlesuits.forEach(suit => { suit._search = indexOf([suit.en, suit.zh, suit.slug, suit.kind, suit.variant, suit.version || '', ...(suit.aliases || [])].join(' ')); });
    });
    const showState = (message, action, handler) => {
      if (!statePanel) { statePanel = document.createElement('div'); statePanel.className = 'empty-state'; statePanel.dataset.i18nIgnore = ''; grid.append(statePanel); }
      const text = document.createElement('p'); text.textContent = message; statePanel.replaceChildren(text); statePanel.hidden = false;
      if (action) { const button=document.createElement('button'); button.type='button'; button.textContent=action; button.addEventListener('click', handler); statePanel.append(button); }
    };
    const hasFilters = () => Boolean(input.value || characterFilter.value !== 'all' || categoryFilter.value !== 'all');
    const clearFilters = () => { input.value = ''; characterFilter.value = 'all'; categoryFilter.value = 'all'; render(); input.focus(); };
    const applyLanguage = () => {
      const c = copy(); input.placeholder = c.placeholder; input.setAttribute('aria-label', c.search); clear.textContent = c.clear;
      document.querySelector('#database-title').textContent = c.heading;
      document.querySelector('#database-description').textContent = c.description;
      document.querySelector('#character-filter-label').textContent = c.characterFilter;
      document.querySelector('#category-filter-label').textContent = c.categoryFilter;
      characterFilter.options[0].textContent = c.allCharacters;
      for (const option of characterFilter.options) { const character = characters.find(item => item.slug === option.value); if (character) option.textContent = nameOf(character); }
      for (const option of categoryFilter.options) option.textContent = c[option.value];
      for (const character of characters) {
        const card = character._card;
        card.setAttribute('aria-label', c.open(nameOf(character)));
        card.querySelector('.name').textContent = nameOf(character);
        card.querySelector('.tag').textContent = nameOf(character._selected);
        card.querySelector('.branch-count').textContent = c.branches(character.battlesuits.length);
        setImage(card.querySelector('img'), character._selected);
      }
      document.querySelector('#database-summary').textContent = c.summary(characters.length, characters.reduce((n, item) => n + item.battlesuits.length, 0));
      renderFile();
    };
    const render = () => {
      clear.hidden = !hasFilters();
      if (state !== 'ready') {
        applyLanguage();
        status.textContent = copy()[state];
        showState(copy()[state], state === 'offline' ? copy().retry : '', () => loadData(true));
        return;
      }
      const terms = input.value.trim().split(/\s+/).map(normalize).filter(Boolean);
      let visible = 0, matching = 0;
      for (const character of characters) {
        const suits = character.battlesuits.filter(suit => categoryMatches(suit) && terms.every(term => (character._search + suit._search).includes(term)));
        const show = (characterFilter.value === 'all' || character.slug === characterFilter.value) && suits.length > 0;
        character._card.hidden = !show;
        if (show) {
          visible++; matching += suits.length;
          character._selected = suits.find(suit => suit.slug === character.default_suit) || suits[0];
        }
      }
      applyLanguage();
      document.querySelector('#result-count').textContent = String(visible).padStart(2, '0');
      status.textContent = copy().count(visible, characters.length, matching);
      if (statePanel) statePanel.hidden = true;
      if (!visible) showState(characters.length ? copy().empty : copy().noRecords, hasFilters() ? copy().clear : '', clearFilters);
    };
    const loadData = async (restoreFocus = false) => {
      state = 'loading';
      for (const control of [input, characterFilter, categoryFilter]) control.disabled = true;
      grid.setAttribute('aria-busy', 'true'); render();
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(JSON_URL, {signal:controller.signal});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (!Array.isArray(data) || data.some(c => !c || typeof c.slug !== 'string' || typeof c.en !== 'string' || !Array.isArray(c.battlesuits) || !c.battlesuits.length || c.battlesuits.some(s => !s.slug || !s.en || !s.image))) throw new Error('Invalid Valkyrie database');
        characters = data.map(c => ({...c, _selected:c.battlesuits.find(s => s.slug === c.default_suit) || c.battlesuits[0], _card:createCard(c)}));
        characterFilter.replaceChildren(characterFilter.options[0], ...characters.map(c => { const option = document.createElement('option'); option.value = c.slug; option.textContent = nameOf(c); return option; }));
        grid.replaceChildren(...characters.map(c => c._card)); statePanel = null;
        updateIndex(); state = 'ready';
        for (const control of [input, characterFilter, categoryFilter]) control.disabled = false;
        render(); if (restoreFocus) input.focus();
      } catch (error) {
        console.error('Unable to load Valkyrie database:', error);
        state = 'offline'; document.querySelector('#result-count').textContent = '00'; render();
        if (restoreFocus) statePanel.querySelector('button')?.focus();
      } finally { clearTimeout(timeout); grid.setAttribute('aria-busy', 'false'); }
    };
    for (const control of [input, characterFilter, categoryFilter]) control.addEventListener(control === input ? 'input' : 'change', () => { if (state === 'ready') render(); });
    clear.addEventListener('click', clearFilters);
    for (const event of ['bhr:languagechange','bhr:translationsready']) window.addEventListener(event, () => { updateIndex(); render(); });
    await loadData();
  };
  document.addEventListener('DOMContentLoaded', load, {once:true});
})();
