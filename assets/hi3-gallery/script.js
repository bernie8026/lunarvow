(() => {
  'use strict';

  const script = document.currentScript;
  const IMG_BASE = script?.dataset.imgBase || 'assets/hi3/characters/';
  const JSON_URL = script?.dataset.json || 'data/characters.json';
  const PLACEHOLDER = 'assets/placeholder.png';

  const languageCopy = {
    'zh-HK': {
      placeholder: '輸入角色或戰衣名稱…',
      offline: '資料庫離線 // 無法載入角色資料',
      empty: '沒有相符檔案 // 搵唔到相符角色'
    },
    'zh-CN': {
      placeholder: '输入角色或战衣名称…',
      offline: '数据库离线 // 无法加载角色资料',
      empty: '没有相符档案 // 找不到相符角色'
    },
    en: {
      placeholder: 'Enter a character or battlesuit name…',
      offline: 'DATABASE OFFLINE // Unable to load character data',
      empty: 'NO MATCHING FILE // No matching character found'
    }
  };

  const currentLanguage = () => window.BHR_I18N?.language || document.body.dataset.language || 'zh-HK';
  const copy = () => languageCopy[currentLanguage()] || languageCopy['zh-HK'];

  const slugToSources = (slug) => ['webp', 'png', 'jpg', 'jpeg', 'avif']
    .map((extension) => `${IMG_BASE}${slug}.${extension}`);

  const characterSources = (character) => {
    const sources = [];
    if (character.image) sources.push(character.image);
    sources.push(...slugToSources(character.slug));
    return [...new Set(sources)];
  };

  const createName = (character) => {
    const name = document.createElement('div');
    name.className = 'name';
    name.append(document.createTextNode(character.en));

    if (character.zh) {
      const chineseName = document.createElement('span');
      chineseName.className = 'zh';
      chineseName.textContent = character.zh;
      name.appendChild(chineseName);
    }

    return name;
  };

  const createCard = (character) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `開啟 ${character.zh || character.en} 圖片`);

    const image = document.createElement('img');
    image.className = 'thumb character-visual';
    image.alt = `${character.en}${character.zh ? ` / ${character.zh}` : ''} | Honkai Impact 3rd`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.opacity = '0';
    image.style.visibility = 'hidden';

    const sources = characterSources(character);
    let sourceIndex = 0;

    const tryNextSource = () => {
      image.style.opacity = '0';
      image.style.visibility = 'hidden';

      if (sourceIndex >= sources.length) {
        image.onerror = null;
        image.src = PLACEHOLDER;
        return;
      }
      image.src = sources[sourceIndex++];
    };

    image.onerror = tryNextSource;
    tryNextSource();

    const meta = document.createElement('div');
    meta.className = 'meta';

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = character.battlesuit || 'VALKYRIE // CHARACTER FILE';

    meta.append(createName(character), tag);
    card.append(image, meta);

    const open = () => openLightbox(
      image.currentSrc || image.src,
      `${character.en}${character.zh ? ` / ${character.zh}` : ''}`,
      character.battlesuit || '',
      character.source || ''
    );

    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    return card;
  };

  let lightbox;

  const ensureLightbox = () => {
    if (lightbox) return lightbox;

    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lb-shell">
        <img class="lb-img character-visual" style="opacity:0;visibility:hidden" alt="">
        <div class="lb-panel">
          <div>
            <span>CHARACTER VISUAL</span>
            <p id="lb-caption"></p>
            <small id="lb-battlesuit"></small>
            <a id="lb-source" href="#" target="_blank" rel="noopener noreferrer">SOURCE FILE ↗</a>
          </div>
          <button class="lb-close" type="button">CLOSE FILE</button>
        </div>
      </div>`;

    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.open) lightbox.close();
    });

    return lightbox;
  };

  const openLightbox = (source, caption, battlesuit, sourcePage) => {
    const dialog = ensureLightbox();
    const image = dialog.querySelector('.lb-img');
    const sourceLink = dialog.querySelector('#lb-source');

    image.style.opacity = '0';
    image.style.visibility = 'hidden';
    image.src = source;
    image.alt = caption;
    dialog.querySelector('#lb-caption').textContent = caption;
    dialog.querySelector('#lb-battlesuit').textContent = battlesuit;

    if (sourcePage) {
      sourceLink.href = sourcePage;
      sourceLink.hidden = false;
    } else {
      sourceLink.hidden = true;
    }

    dialog.showModal();
  };

  const load = async () => {
    const grid = document.querySelector('#grid');
    const input = document.querySelector('#search');
    const resultCount = document.querySelector('#result-count');
    if (!grid || !input) return;

    let searchable = [];
    let visibleItems = [];

    const applyLanguage = () => {
      input.placeholder = copy().placeholder;
      const emptyState = grid.querySelector('.empty-state');
      if (emptyState) {
        emptyState.textContent = searchable.length ? copy().empty : copy().offline;
      }
    };

    const normalize = (value) => (value || '').toLowerCase().replace(/\s+/g, '');

    const render = (items) => {
      visibleItems = items;
      grid.replaceChildren();
      if (resultCount) resultCount.textContent = String(items.length).padStart(2, '0');

      if (!items.length) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = copy().empty;
        grid.appendChild(emptyState);
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((character) => fragment.appendChild(createCard(character)));
      grid.appendChild(fragment);
    };

    try {
      const response = await fetch(JSON_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const list = await response.json();
      searchable = list.map((character) => ({
        ...character,
        _search: normalize(`${character.en}${character.zh || ''}${character.slug || ''}${character.battlesuit || ''}`)
      }));
    } catch (error) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = copy().offline;
      grid.replaceChildren(emptyState);
      if (resultCount) resultCount.textContent = '00';
      console.error('Unable to load character database:', error);
      window.addEventListener('bhr:languagechange', applyLanguage);
      applyLanguage();
      return;
    }

    render(searchable);
    applyLanguage();

    input.addEventListener('input', () => {
      const query = normalize(input.value);
      render(searchable.filter((character) => character._search.includes(query)));
    });

    window.addEventListener('bhr:languagechange', () => {
      applyLanguage();
      if (!visibleItems.length && searchable.length) render(visibleItems);
    });
  };

  document.addEventListener('DOMContentLoaded', load, { once: true });
})();
