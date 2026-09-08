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
      empty: '沒有相符檔案 // 試試其他角色或戰衣名稱',
      loading: '正在載入角色檔案…',
      noRecords: '暫時未有角色檔案',
      retry: '重新載入',
      clear: '清除搜尋',
      search: '搜尋角色或戰衣',
      close: '關閉大圖',
      source: '查看圖片來源 ↗',
      visual: '角色肖像',
      imageError: '暫時無法載入圖片',
      open: (name) => `開啟 ${name} 圖片`,
      count: (visible, total) => `顯示 ${visible} / ${total} 個角色檔案`
    },
    'zh-CN': {
      placeholder: '输入角色或战衣名称…',
      offline: '数据库离线 // 无法加载角色资料',
      empty: '没有相符档案 // 试试其他角色或战衣名称',
      loading: '正在加载角色档案…',
      noRecords: '暂时没有角色档案',
      retry: '重新加载',
      clear: '清除搜索',
      search: '搜索角色或战衣',
      close: '关闭大图',
      source: '查看图片来源 ↗',
      visual: '角色肖像',
      imageError: '暂时无法加载图片',
      open: (name) => `打开 ${name} 图片`,
      count: (visible, total) => `显示 ${visible} / ${total} 个角色档案`
    },
    en: {
      placeholder: 'Enter a character or battlesuit name…',
      offline: 'DATABASE OFFLINE // Unable to load character data',
      empty: 'NO MATCHING FILE // Try another character or battlesuit name',
      loading: 'Loading character files…',
      noRecords: 'No character files available yet',
      retry: 'RETRY',
      clear: 'CLEAR SEARCH',
      search: 'Search characters or battlesuits',
      close: 'CLOSE IMAGE',
      source: 'VIEW IMAGE SOURCE ↗',
      visual: 'CHARACTER VISUAL',
      imageError: 'Image currently unavailable',
      open: (name) => `Open image of ${name}`,
      count: (visible, total) => `Showing ${visible} of ${total} character files`
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
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', copy().open(character.zh || character.en));

    const image = document.createElement('img');
    image.className = 'thumb character-visual';
    image.alt = `${character.en}${character.zh ? ` / ${character.zh}` : ''} | Honkai Impact 3rd`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.opacity = '0';
    image.style.visibility = 'hidden';

    // The shared reveal animation handles loaded images when available.
    image.addEventListener('load', () => {
      if (!image.dataset.imageState) {
        image.style.opacity = '1';
        image.style.visibility = 'visible';
      }
    });

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
      currentLanguage() === 'en' ? character.en : character.zh || character.en,
      character.battlesuit || '',
      character.source || '',
      card
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
  let lightboxTrigger;

  const applyLightboxLanguage = () => {
    if (!lightbox) return;
    lightbox.querySelector('.lb-close').textContent = copy().close;
    lightbox.querySelector('#lb-source').textContent = copy().source;
    lightbox.querySelector('.lb-panel span').textContent = copy().visual;
    lightbox.querySelector('.lb-image-error').textContent = copy().imageError;
  };

  const ensureLightbox = () => {
    if (lightbox) return lightbox;

    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-labelledby', 'lb-caption');
    lightbox.setAttribute('aria-describedby', 'lb-battlesuit');
    lightbox.innerHTML = `
      <div class="lb-shell">
        <div class="lb-visual">
          <img class="lb-img character-visual" style="opacity:0;visibility:hidden" alt="">
          <p class="lb-image-error" role="status" data-i18n-ignore hidden></p>
        </div>
        <div class="lb-panel">
          <div>
            <span data-i18n-ignore>CHARACTER VISUAL</span>
            <p id="lb-caption"></p>
            <small id="lb-battlesuit"></small>
            <a id="lb-source" href="#" target="_blank" rel="noopener noreferrer" data-i18n-ignore>SOURCE FILE ↗</a>
          </div>
          <button class="lb-close" type="button" autofocus data-i18n-ignore>CLOSE FILE</button>
        </div>
      </div>`;

    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('close', () => {
      document.body.classList.remove('gallery-dialog-open');
      if (lightboxTrigger?.isConnected && !lightboxTrigger.hidden) lightboxTrigger.focus({ preventScroll: true });
    });

    applyLightboxLanguage();

    return lightbox;
  };

  const openLightbox = (source, caption, battlesuit, sourcePage, trigger) => {
    const dialog = ensureLightbox();
    const image = dialog.querySelector('.lb-img');
    const sourceLink = dialog.querySelector('#lb-source');
    const imageError = dialog.querySelector('.lb-image-error');

    lightboxTrigger = trigger;
    imageError.hidden = true;
    image.style.opacity = '0';
    image.style.visibility = 'hidden';
    image.onerror = () => { imageError.hidden = false; };
    image.onload = () => {
      imageError.hidden = true;
      if (!image.dataset.imageState) {
        image.style.opacity = '1';
        image.style.visibility = 'visible';
      }
    };
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

    applyLightboxLanguage();
    dialog.showModal();
    document.body.classList.add('gallery-dialog-open');
    dialog.querySelector('.lb-close').focus({ preventScroll: true });
  };

  const load = async () => {
    const grid = document.querySelector('#grid');
    const input = document.querySelector('#search');
    const resultCount = document.querySelector('#result-count');
    const status = document.querySelector('#search-status');
    const clearButton = document.querySelector('#clear-search');
    if (!grid || !input || !status || !clearButton) return;

    let searchable = [];
    let visibleItems = [];
    let state = 'loading';
    let statePanel;

    const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

    const updateSearchIndex = () => {
      searchable.forEach((character) => {
        const text = `${character.en} ${character.zh || ''} ${character.slug || ''} ${character.battlesuit || ''}`;
        const simplified = window.BHR_I18N?.translate(text, 'zh-CN') || '';
        character._search = normalize(`${text} ${simplified}`);
      });
    };

    const showState = (message, action, handler) => {
      if (!statePanel) {
        statePanel = document.createElement('div');
        statePanel.className = 'empty-state';
        statePanel.dataset.i18nIgnore = '';
        grid.appendChild(statePanel);
      }
      const label = document.createElement('p');
      label.textContent = message;
      statePanel.replaceChildren(label);
      statePanel.hidden = false;
      if (action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = action;
        button.addEventListener('click', handler);
        statePanel.appendChild(button);
      }
    };

    const applyLanguage = () => {
      input.placeholder = copy().placeholder;
      input.setAttribute('aria-label', copy().search);
      clearButton.textContent = copy().clear;
      searchable.forEach((character) => {
        const name = currentLanguage() === 'en' ? character.en : character.zh || character.en;
        character._card.setAttribute('aria-label', copy().open(window.BHR_I18N?.translate(name) || name));
      });
      applyLightboxLanguage();
      if (state === 'loading' || state === 'offline') {
        status.textContent = copy()[state];
        showState(copy()[state], state === 'offline' ? copy().retry : '', () => loadData(true));
      } else {
        status.textContent = copy().count(visibleItems.length, searchable.length);
        if (!visibleItems.length) {
          showState(searchable.length ? copy().empty : copy().noRecords, input.value ? copy().clear : '', clearSearch);
        }
      }
    };

    const render = (items) => {
      visibleItems = items;
      const visible = new Set(items);
      searchable.forEach((character) => { character._card.hidden = !visible.has(character); });
      if (statePanel) statePanel.hidden = true;
      if (resultCount) resultCount.textContent = String(items.length).padStart(2, '0');
      clearButton.hidden = !input.value;
      applyLanguage();
    };

    const filter = () => {
      const terms = input.value.normalize('NFKC').trim().split(/\s+/).map(normalize).filter(Boolean);
      render(searchable.filter((character) => terms.every((term) => character._search.includes(term))));
    };

    const clearSearch = () => {
      input.value = '';
      filter();
      input.focus();
    };

    const loadData = async (restoreFocus = false) => {
      state = 'loading';
      input.disabled = true;
      grid.setAttribute('aria-busy', 'true');
      applyLanguage();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(JSON_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const list = await response.json();
        if (!Array.isArray(list) || list.some((character) => !character || typeof character.en !== 'string' || typeof character.slug !== 'string')) {
          throw new Error('Invalid character database');
        }
        searchable = list.map((character) => ({ ...character, _card: createCard(character) }));
        updateSearchIndex();
        grid.replaceChildren(...searchable.map((character) => character._card));
        statePanel = null;
        state = 'ready';
        input.disabled = false;
        filter();
        if (restoreFocus) input.focus();
      } catch (error) {
        state = 'offline';
        if (resultCount) resultCount.textContent = '00';
        console.error('Unable to load character database:', error);
        applyLanguage();
        if (restoreFocus) statePanel.querySelector('button')?.focus();
      } finally {
        window.clearTimeout(timeout);
        grid.setAttribute('aria-busy', 'false');
      }
    };

    input.addEventListener('input', () => {
      if (state === 'ready') filter();
    });
    clearButton.addEventListener('click', clearSearch);

    window.addEventListener('bhr:languagechange', () => {
      updateSearchIndex();
      if (state === 'ready') filter();
      else applyLanguage();
    });
    window.addEventListener('bhr:translationsready', () => {
      updateSearchIndex();
      if (state === 'ready') filter();
    });

    await loadData();
  };

  document.addEventListener('DOMContentLoaded', load, { once: true });
})();
