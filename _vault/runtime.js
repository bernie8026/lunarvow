(() => {
  'use strict';
  const BUILD = 'd3fce1f3ca60a981314e9de1b197fc66';
  const root = new URL('../', document.currentScript.src);
  const storageKey = `lunar-vault:${root.pathname}`;
  const isContent = document.documentElement.hasAttribute('data-vault-content');
  const strings = {
  "zh-HK": {
    "title": "月下檔案已封存",
    "intro": "輸入密碼，解鎖完整檔案庫。",
    "password": "入站密碼",
    "unlock": "解鎖檔案",
    "show": "顯示密碼",
    "hide": "隱藏密碼",
    "ready": "等待艦長解鎖",
    "preparing": "正在準備入口…",
    "busy": "正在驗證…",
    "passwordError": "密碼唔正確，或加密檔案驗證失敗。請再試一次。",
    "network": "暫時讀取唔到加密檔案，請檢查連線後再試。",
    "changed": "檔案已更新，請重新載入並輸入密碼。",
    "unsupported": "請用支援 Service Worker 嘅瀏覽器，透過 HTTPS 開啟網站。",
    "note": "解鎖後可隨時按「鎖定檔案」關閉存取。",
    "lock": "鎖定檔案",
    "language": "選擇語言"
  },
  "en": {
    "title": "An archive under seal",
    "intro": "Enter the password to unlock the complete archive.",
    "password": "Archive password",
    "unlock": "Unlock archive",
    "show": "Show password",
    "hide": "Hide password",
    "ready": "Awaiting the Captain",
    "preparing": "Preparing the entrance…",
    "busy": "Verifying…",
    "passwordError": "The password is incorrect or the encrypted files failed verification. Please try again.",
    "network": "The encrypted files could not be loaded. Check your connection and try again.",
    "changed": "The archive has changed. Reload and enter the password again.",
    "unsupported": "Open this site over HTTPS in a browser that supports service workers.",
    "note": "Use “Lock archive” whenever you want to close access.",
    "lock": "Lock archive",
    "language": "Choose a language"
  },
  "zh-CN": {
    "title": "月下档案已封存",
    "intro": "输入密码，解锁完整档案库。",
    "password": "入站密码",
    "unlock": "解锁档案",
    "show": "显示密码",
    "hide": "隐藏密码",
    "ready": "等待舰长解锁",
    "preparing": "正在准备入口…",
    "busy": "正在验证…",
    "passwordError": "密码不正确，或加密文件验证失败。请重试。",
    "network": "暂时无法读取加密文件，请检查连接后重试。",
    "changed": "档案已更新，请重新加载并输入密码。",
    "unsupported": "请用支持 Service Worker 的浏览器，通过 HTTPS 打开网站。",
    "note": "解锁后可随时按“锁定档案”关闭访问。",
    "lock": "锁定档案",
    "language": "选择语言"
  },
  "ja": {
    "title": "封印された月下アーカイブ",
    "intro": "パスワードを入力してアーカイブ全体を開きます。",
    "password": "入場パスワード",
    "unlock": "アーカイブを開く",
    "show": "パスワードを表示",
    "hide": "パスワードを隠す",
    "ready": "艦長の到着を待機中",
    "preparing": "入口を準備中…",
    "busy": "確認中…",
    "passwordError": "パスワードが違うか、暗号化ファイルを検証できません。もう一度お試しください。",
    "network": "暗号化ファイルを読み込めません。接続を確認して再試行してください。",
    "changed": "アーカイブが更新されました。再読み込みしてパスワードを入力してください。",
    "unsupported": "Service Worker対応ブラウザーでHTTPS経由で開いてください。",
    "note": "閲覧を終えるときは「アーカイブをロック」を押してください。",
    "lock": "アーカイブをロック",
    "language": "言語を選択"
  },
  "ko": {
    "title": "봉인된 월하 기록실",
    "intro": "비밀번호를 입력해 전체 기록실을 여세요.",
    "password": "입장 비밀번호",
    "unlock": "기록실 잠금 해제",
    "show": "비밀번호 표시",
    "hide": "비밀번호 숨기기",
    "ready": "함장 입장 대기 중",
    "preparing": "입구 준비 중…",
    "busy": "확인 중…",
    "passwordError": "비밀번호가 틀리거나 암호화 파일 검증에 실패했습니다. 다시 시도하세요.",
    "network": "암호화 파일을 불러올 수 없습니다. 연결을 확인하고 다시 시도하세요.",
    "changed": "기록실이 업데이트됐습니다. 새로고침 후 비밀번호를 다시 입력하세요.",
    "unsupported": "Service Worker 지원 브라우저에서 HTTPS로 열어 주세요.",
    "note": "열람을 끝내려면 ‘기록실 잠금’을 누르세요.",
    "lock": "기록실 잠금",
    "language": "언어 선택"
  },
  "th": {
    "title": "คลัง Lunar Vow ที่ถูกผนึก",
    "intro": "ใส่รหัสผ่านเพื่อปลดล็อกคลังข้อมูลทั้งหมด",
    "password": "รหัสผ่านคลังข้อมูล",
    "unlock": "ปลดล็อกคลังข้อมูล",
    "show": "แสดงรหัสผ่าน",
    "hide": "ซ่อนรหัสผ่าน",
    "ready": "รอกัปตันปลดล็อก",
    "preparing": "กำลังเตรียมทางเข้า…",
    "busy": "กำลังตรวจสอบ…",
    "passwordError": "รหัสผ่านไม่ถูกต้องหรือยืนยันไฟล์เข้ารหัสไม่สำเร็จ โปรดลองอีกครั้ง",
    "network": "โหลดไฟล์เข้ารหัสไม่ได้ ตรวจสอบการเชื่อมต่อแล้วลองใหม่",
    "changed": "คลังข้อมูลอัปเดตแล้ว โหลดหน้าใหม่และใส่รหัสผ่านอีกครั้ง",
    "unsupported": "เปิดผ่าน HTTPS ด้วยเบราว์เซอร์ที่รองรับ Service Worker",
    "note": "กด “ล็อกคลังข้อมูล” เมื่อต้องการปิดการเข้าถึง",
    "lock": "ล็อกคลังข้อมูล",
    "language": "เลือกภาษา"
  },
  "ru": {
    "title": "Запечатанный архив Lunar Vow",
    "intro": "Введите пароль, чтобы открыть весь архив.",
    "password": "Пароль архива",
    "unlock": "Открыть архив",
    "show": "Показать пароль",
    "hide": "Скрыть пароль",
    "ready": "Ожидаем Капитана",
    "preparing": "Подготовка входа…",
    "busy": "Проверка…",
    "passwordError": "Неверный пароль или ошибка проверки зашифрованных файлов. Попробуйте снова.",
    "network": "Не удалось загрузить зашифрованные файлы. Проверьте соединение и повторите попытку.",
    "changed": "Архив обновился. Перезагрузите страницу и снова введите пароль.",
    "unsupported": "Откройте сайт через HTTPS в браузере с поддержкой Service Worker.",
    "note": "Чтобы закрыть доступ, нажмите «Закрыть архив».",
    "lock": "Закрыть архив",
    "language": "Выбрать язык"
  }
};
  let language = 'zh-HK';
  let memoryKey = null;
  let statusName = 'preparing';
  let busy = false;
  let checking = null;
  try { language = localStorage.getItem('bhr-language') || language; } catch {}
  if (!strings[language]) language = 'zh-HK';
  const readKey = () => {
    try { memoryKey = JSON.parse(sessionStorage.getItem(storageKey)) || memoryKey; } catch {}
    if (memoryKey?.build !== BUILD) return null;
    return memoryKey;
  };
  const saveKey = key => {
    memoryKey = { build: BUILD, key };
    try { sessionStorage.setItem(storageKey, JSON.stringify(memoryKey)); } catch { /* Memory-only access still works. */ }
  };
  const clearKey = () => { memoryKey = null; try { sessionStorage.removeItem(storageKey); } catch {} };
  const encode = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  const request = (type, data = {}) => new Promise((resolve, reject) => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) { reject(new Error('network')); return; }
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('network')); }, 45000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close(); resolve(event.data);
    };
    controller.postMessage({ type, ...data }, [channel.port2]);
  });
  function render() {
    const copy = strings[language];
    if (!isContent) {
      document.documentElement.lang = language;
      document.title = `${copy.title} // Lunar Vow`;
    }
    for (const element of document.querySelectorAll('[data-vault-text]')) element.textContent = copy[element.dataset.vaultText];
    const languageSelect=document.querySelector('[data-vault-language-select]');if(languageSelect)languageSelect.value=language;
    for (const button of document.querySelectorAll('[data-vault-language]')) button.setAttribute('aria-pressed', String(button.dataset.vaultLanguage === language));
    document.querySelector('[data-vault-languages]')?.setAttribute('aria-label', copy.language);
    document.querySelector('[data-vault-language-select]')?.setAttribute('aria-label',copy.language);
    const status = document.querySelector('[data-vault-status]');
    if (status) {
      status.textContent = copy[statusName] || copy.network;
      status.classList.toggle('is-error', ['passwordError', 'network', 'changed', 'unsupported'].includes(statusName));
    }
    const show = document.querySelector('[data-vault-show]');
    if (show) show.textContent = document.querySelector('[data-vault-password]').type === 'password' ? copy.show : copy.hide;
    const submit = document.querySelector('[data-vault-submit]');
    if (submit) submit.textContent = busy ? copy.busy : copy.unlock;
  }
  function closeContent() {
    clearKey();
    if (isContent) {
      document.documentElement.setAttribute('data-vault-pending', '');
      for (const media of document.querySelectorAll('audio,video')) media.pause();
      location.reload();
    } else { statusName = 'ready'; render(); }
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
    if (event.source !== navigator.serviceWorker.controller) return;
    if (event.data?.type === 'VAULT_KEY_REQUEST') event.ports[0]?.postMessage(readKey());
    if (event.data?.type === 'VAULT_LOCKED') closeContent();
  });

  async function worker() {
    if (!window.isSecureContext || !navigator.serviceWorker || !crypto.subtle || !window.DecompressionStream) throw new Error('unsupported');
    const registration = await navigator.serviceWorker.register(new URL('vault-sw.js', root), { scope: root.pathname, updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
    if (registration.installing) await new Promise((resolve, reject) => {
      const installing = registration.installing;
      const timer = setTimeout(() => reject(new Error('network')), 30000);
      const changed = () => {
        if (installing.state === 'activated' || installing.state === 'redundant') {
          clearTimeout(timer); installing.removeEventListener('statechange', changed); resolve();
        }
      };
      installing.addEventListener('statechange', changed); changed();
    });
    if (!navigator.serviceWorker.controller) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('network')), 10000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    return registration;
  }
  async function verifyContent() {
    if (checking) return checking;
    checking = (async () => {
      try {
        const state = await request('VAULT_STATUS');
        if (!state.ok || state.build !== BUILD) { closeContent(); return; }
        document.documentElement.removeAttribute('data-vault-pending');
      } catch { closeContent(); }
    })().finally(() => { checking = null; });
    return checking;
  }
  async function openGate() {
    const form = document.querySelector('[data-vault-form]');
    const input = document.querySelector('[data-vault-password]');
    const submit = document.querySelector('[data-vault-submit]');
    let settings;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !settings || !input.value) return;
      busy = true; submit.disabled = true; statusName = 'busy'; render();
      try {
        const password = input.value.normalize('NFC');
        input.value = '';
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const key = encode(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decode(settings.salt), iterations: settings.iterations, hash: 'SHA-256' }, material, 256));
        const result = await request('VAULT_UNLOCK', { key, build: BUILD });
        if (!result.ok) throw new Error(result.error);
        saveKey(key);
        location.reload();
      } catch (error) {
        clearKey(); statusName = error.message === 'password' ? 'passwordError' : error.message === 'changed' ? 'changed' : 'network';
        busy = false; submit.disabled = false; render(); input.focus();
      }
    });
    document.querySelector('[data-vault-show]').addEventListener('click', event => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      event.currentTarget.setAttribute('aria-pressed', String(show)); render();
    });
    for (const button of document.querySelectorAll('[data-vault-language]')) button.addEventListener('click', () => {
      language = button.dataset.vaultLanguage;
      try { localStorage.setItem('bhr-language', language); } catch {}
      render();
    });
    document.querySelector('[data-vault-language-select]')?.addEventListener('change',event=>{language=event.target.value;try{localStorage.setItem('bhr-language',language);}catch{}render();});
    render();
    try {
      await worker();
      const response = await fetch(new URL('_vault/config.json', root), { cache: 'no-cache', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('network');
      settings = await response.json();
      if (settings.format !== 'lunarvow-vault-v2' || settings.build !== BUILD || settings.compression !== 'gzip' || settings.iterations !== 600000 || !/^[A-Za-z0-9+/]{43}=$/.test(settings.salt)) throw new Error('changed');
      const saved = readKey();
      if (saved) {
        const result = await request('VAULT_UNLOCK', saved);
        if (result.ok) { location.reload(); return; }
        clearKey();
      } else {
        const state = await request('VAULT_STATUS');
        if (state.ok && state.build === BUILD) { location.reload(); return; }
      }
      input.disabled = false; submit.disabled = false;
      statusName = 'ready'; render();
    } catch (error) { statusName = ['unsupported', 'changed'].includes(error.message) ? error.message : 'network'; render(); }
  }

  if (isContent) {
    const lock = document.createElement('button');
    lock.type = 'button'; lock.className = 'vault-session-lock'; lock.dataset.vaultText = 'lock';
    lock.dataset.i18nIgnore = ''; lock.setAttribute('translate', 'no');
    lock.addEventListener('click', async () => {
      clearKey();
      document.documentElement.setAttribute('data-vault-pending', '');
      try { await request('VAULT_LOCK'); }
      catch { await (await navigator.serviceWorker.getRegistration(root.href))?.unregister(); }
      location.reload();
    });
    // Keep late-created music and motion controls with the lock, in normal flow.
    const controls = document.createElement('div');
    controls.className = 'vault-session-controls';
    document.body.append(controls);
    controls.append(lock);
    const arrangeControls = () => {
      for (const selector of ['.music-console', '.motion-control']) {
        const element = document.querySelector(selector);
        if (element && element.parentElement !== controls) controls.append(element);
      }
    };
    const controlsObserver = new MutationObserver(arrangeControls);
    controlsObserver.observe(document.body, { childList: true });
    arrangeControls();
    render();
    window.addEventListener('bhr:languagechange', event => { language = event.detail?.language || language; if (!strings[language]) language = 'zh-HK'; render(); });
    window.addEventListener('pageshow', () => verifyContent());
    // A history snapshot must remain hidden until its session is checked again.
    window.addEventListener('pagehide', () => document.documentElement.setAttribute('data-vault-pending', ''));
    navigator.serviceWorker.addEventListener('controllerchange', () => verifyContent());
    worker().then(verifyContent).catch(closeContent);
  } else openGate();
})();
