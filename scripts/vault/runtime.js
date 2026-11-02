(() => {
  'use strict';
  const BUILD = '@@BUILD@@';
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
  let gateReady = false;
  let setupToken = '';
  try {
    const fragment=new URLSearchParams(location.hash.slice(1));
    if(fragment.has('passkey-setup')){
      const token=fragment.get('passkey-setup');
      if(/^[A-Za-z0-9_-]{32,256}$/.test(token||''))setupToken=token;
      history.replaceState(null,'',location.pathname+location.search);
    }
  }catch{}
  const passkeyButton=document.querySelector('[data-vault-passkey]');
  const registerButton=document.querySelector('[data-vault-passkey-register]');
  const setupPanel=document.querySelector('[data-vault-passkey-setup]');
  const passkeySupported=!!(window.PublicKeyCredential&&navigator.credentials?.get&&navigator.credentials?.create);
  const passkeyCopy={
    'zh-HK':{passkey:'使用通行密鑰',passkeyHint:'使用 Face ID、Touch ID，或選擇另一部裝置。',passkeyUnavailable:'呢個瀏覽器未能使用通行密鑰，請使用密碼解鎖。',setupTitle:'新增你嘅通行密鑰',setupHelp:'呢個係擁有人提供嘅一次性登記邀請。確認後，通行密鑰會由你嘅裝置或密碼管理工具保存。',registerPasskey:'新增通行密鑰',passkeyWaiting:'請喺裝置確認通行密鑰…',registering:'請喺裝置確認新增通行密鑰…',passkeyCancelled:'已取消通行密鑰操作，或者操作已逾時。你可以重新開始，或使用密碼。',passkeyRejected:'通行密鑰未能通過驗證。請重試或使用密碼。',passkeyRegistered:'通行密鑰已新增。撳「使用通行密鑰」即可解鎖。',inviteInvalid:'登記邀請已失效或已使用，請向擁有人取得新邀請。',passkeyDuplicate:'呢部裝置已有登記嘅通行密鑰，請使用佢登入。',passkeyThrottled:'通行密鑰請求太頻密，請稍後再試。'},
    en:{passkey:'Use a passkey',passkeyHint:'Use Face ID, Touch ID, or choose another device.',passkeyUnavailable:'Passkeys are unavailable in this browser. Use the password to unlock.',setupTitle:'Add your passkey',setupHelp:'This is a one-time invitation from the owner. Your device or password manager will save the passkey after you confirm.',registerPasskey:'Add a passkey',passkeyWaiting:'Confirm the passkey on your device…',registering:'Confirm the new passkey on your device…',passkeyCancelled:'The passkey request was cancelled or timed out. Try again or use the password.',passkeyRejected:'The passkey could not be verified. Try again or use the password.',passkeyRegistered:'Passkey added. Choose “Use a passkey” to unlock.',inviteInvalid:'The invitation has expired or was already used. Ask the owner for a new invitation.',passkeyDuplicate:'A passkey is already registered on this device. Use it to sign in.',passkeyThrottled:'Too many passkey requests. Please try again shortly.'},
    'zh-CN':{passkey:'使用通行密钥',passkeyHint:'使用 Face ID、Touch ID，或选择另一台设备。',passkeyUnavailable:'此浏览器无法使用通行密钥，请使用密码解锁。',setupTitle:'新增你的通行密钥',setupHelp:'这是网站所有者提供的一次性登记邀请。确认后，通行密钥由你的设备或密码管理工具保存。',registerPasskey:'新增通行密钥',passkeyWaiting:'请在设备上确认通行密钥…',registering:'请在设备上确认新增通行密钥…',passkeyCancelled:'通行密钥操作已取消或超时。请重试或使用密码。',passkeyRejected:'通行密钥未能通过验证。请重试或使用密码。',passkeyRegistered:'通行密钥已新增。点击“使用通行密钥”即可解锁。',inviteInvalid:'登记邀请已失效或已使用，请向网站所有者获取新邀请。',passkeyDuplicate:'此设备已有登记的通行密钥，请使用它登录。',passkeyThrottled:'通行密钥请求过于频繁，请稍后重试。'},
    ja:{passkey:'パスキーを使う',passkeyHint:'Face ID、Touch ID、または別のデバイスを選択します。',passkeyUnavailable:'このブラウザーではパスキーを利用できません。パスワードを使ってください。',setupTitle:'パスキーを追加',setupHelp:'管理者からの一度限りの登録招待です。確認後、デバイスまたはパスワード管理ツールがパスキーを保存します。',registerPasskey:'パスキーを追加',passkeyWaiting:'デバイスでパスキーを確認してください…',registering:'デバイスで新しいパスキーを確認してください…',passkeyCancelled:'操作がキャンセルされたか、時間切れになりました。再試行するかパスワードを使ってください。',passkeyRejected:'パスキーを確認できませんでした。再試行するかパスワードを使ってください。',passkeyRegistered:'パスキーを追加しました。「パスキーを使う」でロックを解除できます。',inviteInvalid:'招待は期限切れか使用済みです。管理者に新しい招待を依頼してください。',passkeyDuplicate:'このデバイスには登録済みのパスキーがあります。それを使ってログインしてください。',passkeyThrottled:'パスキーの要求が多すぎます。しばらくしてから再試行してください。'},
    ko:{passkey:'패스키 사용',passkeyHint:'Face ID, Touch ID 또는 다른 기기를 선택하세요.',passkeyUnavailable:'이 브라우저에서 패스키를 사용할 수 없습니다. 비밀번호로 잠금을 해제하세요.',setupTitle:'패스키 추가',setupHelp:'관리자가 보낸 일회용 등록 초대입니다. 확인 후 기기나 비밀번호 관리자가 패스키를 저장합니다.',registerPasskey:'패스키 추가',passkeyWaiting:'기기에서 패스키를 확인해 주세요…',registering:'기기에서 새 패스키를 확인해 주세요…',passkeyCancelled:'패스키 요청을 취소했거나 시간이 초과되었습니다. 다시 시도하거나 비밀번호를 사용하세요.',passkeyRejected:'패스키를 확인하지 못했습니다. 다시 시도하거나 비밀번호를 사용하세요.',passkeyRegistered:'패스키를 추가했습니다. “패스키 사용”을 선택하여 잠금을 해제하세요.',inviteInvalid:'초대가 만료되었거나 이미 사용되었습니다. 관리자에게 새 초대를 요청하세요.',passkeyDuplicate:'이 기기에 등록된 패스키가 있습니다. 해당 패스키로 로그인하세요.',passkeyThrottled:'패스키 요청이 너무 많습니다. 잠시 후 다시 시도하세요.'},
    th:{passkey:'ใช้พาสคีย์',passkeyHint:'ใช้ Face ID, Touch ID หรือเลือกอุปกรณ์อื่น',passkeyUnavailable:'เบราว์เซอร์นี้ใช้พาสคีย์ไม่ได้ โปรดใช้รหัสผ่านเพื่อปลดล็อก',setupTitle:'เพิ่มพาสคีย์ของคุณ',setupHelp:'นี่คือคำเชิญลงทะเบียนแบบใช้ครั้งเดียวจากเจ้าของเว็บไซต์ หลังยืนยัน อุปกรณ์หรือแอปจัดการรหัสผ่านจะบันทึกพาสคีย์',registerPasskey:'เพิ่มพาสคีย์',passkeyWaiting:'โปรดยืนยันพาสคีย์บนอุปกรณ์ของคุณ…',registering:'โปรดยืนยันพาสคีย์ใหม่บนอุปกรณ์ของคุณ…',passkeyCancelled:'ยกเลิกคำขอพาสคีย์หรือหมดเวลาแล้ว ลองอีกครั้งหรือใช้รหัสผ่าน',passkeyRejected:'ตรวจสอบพาสคีย์ไม่สำเร็จ โปรดลองอีกครั้งหรือใช้รหัสผ่าน',passkeyRegistered:'เพิ่มพาสคีย์แล้ว เลือก “ใช้พาสคีย์” เพื่อปลดล็อก',inviteInvalid:'คำเชิญหมดอายุหรือถูกใช้แล้ว โปรดขอคำเชิญใหม่จากเจ้าของเว็บไซต์',passkeyDuplicate:'อุปกรณ์นี้มีพาสคีย์ที่ลงทะเบียนแล้ว โปรดใช้พาสคีย์นั้นเข้าสู่ระบบ',passkeyThrottled:'มีคำขอพาสคีย์มากเกินไป โปรดลองอีกครั้งภายหลัง'},
    ru:{passkey:'Войти с ключом доступа',passkeyHint:'Используйте Face ID, Touch ID или выберите другое устройство.',passkeyUnavailable:'В этом браузере ключи доступа недоступны. Используйте пароль.',setupTitle:'Добавить ключ доступа',setupHelp:'Это одноразовое приглашение от владельца. После подтверждения устройство или менеджер паролей сохранит ключ доступа.',registerPasskey:'Добавить ключ доступа',passkeyWaiting:'Подтвердите ключ доступа на устройстве…',registering:'Подтвердите новый ключ доступа на устройстве…',passkeyCancelled:'Запрос отменён или время ожидания истекло. Повторите попытку или используйте пароль.',passkeyRejected:'Не удалось проверить ключ доступа. Повторите попытку или используйте пароль.',passkeyRegistered:'Ключ доступа добавлен. Выберите «Войти с ключом доступа» для разблокировки.',inviteInvalid:'Приглашение истекло или уже использовано. Запросите новое у владельца.',passkeyDuplicate:'На этом устройстве уже есть зарегистрированный ключ доступа. Используйте его для входа.',passkeyThrottled:'Слишком много запросов ключа доступа. Попробуйте позже.'}
  };

  for(const locale of Object.keys(passkeyCopy))Object.assign(strings[locale],passkeyCopy[locale]);
  const noPasskeys={
    'zh-HK':'目前未登記通行密鑰。請使用密碼，或用擁有人提供嘅邀請登記。',
    en:'No passkey is registered yet. Use the password, or register with an invitation from the owner.',
    'zh-CN':'目前尚未登记通行密钥。请使用密码，或通过网站所有者提供的邀请登记。',
    ja:'パスキーはまだ登録されていません。パスワードを使うか、管理者からの招待で登録してください。',
    ko:'등록된 패스키가 없습니다. 비밀번호를 사용하거나 관리자의 초대로 등록하세요.',
    th:'ยังไม่มีพาสคีย์ที่ลงทะเบียน โปรดใช้รหัสผ่านหรือลงทะเบียนผ่านคำเชิญจากเจ้าของเว็บไซต์',
    ru:'Ключ доступа ещё не зарегистрирован. Используйте пароль или зарегистрируйте ключ по приглашению владельца.'
  };

  for(const locale of Object.keys(noPasskeys))strings[locale].noPasskeys=noPasskeys[locale];
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
  const bytes = decode;
  function webauthnBytes(value){
    if(typeof value!=='string'||value.length>65536||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid credential data');
    return bytes(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
  }
  function webauthnBase64(value){
    if(!(value instanceof ArrayBuffer)&&!ArrayBuffer.isView(value))throw new Error('Invalid credential data');
    const data=value instanceof ArrayBuffer?new Uint8Array(value):new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    if(data.length>65536)throw new Error('Credential data too large');
    let binary='';for(const byte of data)binary+=String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function credentialOptions(options,registration){
    if(!options||typeof options!=='object')throw new Error('Missing credential options');
    const next={...options,challenge:webauthnBytes(options.challenge)};
    if(registration){
      next.user={...options.user,id:webauthnBytes(options.user?.id)};
      next.authenticatorSelection={...options.authenticatorSelection,residentKey:'required',userVerification:'required'};
    }else next.userVerification='required';
    for(const field of ['allowCredentials','excludeCredentials'])if(next[field]){
      if(!Array.isArray(next[field])||next[field].length>100)throw new Error('Invalid credential list');
      next[field]=next[field].map(item=>({...item,id:webauthnBytes(item.id)}));
    }
    return next;
  }
  function credentialJSON(credential,registration){
    if(!credential||credential.type!=='public-key')throw new Error('Missing credential');
    const data=credential.response;
    const response={clientDataJSON:webauthnBase64(data.clientDataJSON)};
    if(registration){
      response.attestationObject=webauthnBase64(data.attestationObject);
      if(typeof data.getTransports==='function')response.transports=data.getTransports();
    }else{
      response.authenticatorData=webauthnBase64(data.authenticatorData);
      response.signature=webauthnBase64(data.signature);
      response.userHandle=data.userHandle?webauthnBase64(data.userHandle):null;
    }
    return {id:credential.id,rawId:webauthnBase64(credential.rawId),type:credential.type,response,
      clientExtensionResults:credential.getClientExtensionResults(),
      ...(credential.authenticatorAttachment?{authenticatorAttachment:credential.authenticatorAttachment}:{})};
  }

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
      status.classList.toggle('is-error', ['passwordError', 'network', 'changed', 'unsupported','passkeyRejected','inviteInvalid','passkeyThrottled','passkeyDuplicate'].includes(statusName));
    }
    const show = document.querySelector('[data-vault-show]');
    if (show) show.textContent = document.querySelector('[data-vault-password]').type === 'password' ? copy.show : copy.hide;
    const submit = document.querySelector('[data-vault-submit]');
    if (submit) {submit.textContent = busy ? copy.busy : copy.unlock;submit.disabled=busy||!gateReady;}
    if(passkeyButton){passkeyButton.textContent=copy.passkey;passkeyButton.disabled=busy||!gateReady||!passkeySupported;}
    if(registerButton){registerButton.textContent=copy.registerPasskey;registerButton.disabled=busy||!gateReady||!passkeySupported||!setupToken;}
    const note=document.querySelector('[data-vault-passkey-note]');
    if(note)note.textContent=passkeySupported?copy.passkeyHint:copy.passkeyUnavailable;
    for(const element of document.querySelectorAll('[data-passkey-text]'))element.textContent=copy[element.dataset.passkeyText]||'';
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
    const enter=()=>location.pathname===new URL('unlock.html',root).pathname?location.replace(root.href):location.reload();
    async function openWithKey(key){
      const result=await request('VAULT_UNLOCK',{key,build:BUILD});
      if(!result.ok)throw Error(result.error);
      saveKey(key);input.value='';enter();
    }
    async function accessRequest(path,body){
      const bridge=settings.passkeys,origin=new URL(bridge.authOrigin);
      if(origin.protocol!=='https:'||origin.origin!==bridge.authOrigin||!origin.hostname.endsWith('.workers.dev'))throw Error('Invalid authentication origin');
      const response=await fetch(new URL(path,origin),{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,archiveId:bridge.archiveId})});
      const reply=await response.json();
      if(!response.ok||reply.ok!==true){const error=Error('Passkey access denied');error.accessCode=reply.code;throw error;}
      return reply;
    }
    function failPasskey(error){
      busy=false;
      statusName=['NotAllowedError','AbortError'].includes(error.name)?'passkeyCancelled':error.name==='InvalidStateError'?'passkeyDuplicate':
        ['invalid_invitation','invitation_expired','invitation_used','invite_invalid'].includes(error.accessCode)?'inviteInvalid':
        error.accessCode==='no_passkeys'?'noPasskeys':
        ['rate_limited','passkey_rate_limited','passkey_rate_limit','passkey_busy'].includes(error.accessCode)?'passkeyThrottled':'passkeyRejected';
      render();
    }
    passkeyButton?.addEventListener('click',async()=>{
      if(busy||!gateReady||!settings.passkeys||!passkeySupported)return;
      busy=true;statusName='passkeyWaiting';render();
      try{
        const bridge=settings.passkeys;
        const start=await accessRequest('/v1/passkeys/auth/options',{});
        const credential=await navigator.credentials.get({publicKey:credentialOptions(start.options,false)});
        const access=await accessRequest('/v1/passkeys/auth/verify',{flowId:start.flowId,response:credentialJSON(credential,false)});
        if(access.archiveId!==bridge.archiveId)throw Error('Archive mismatch');
        const raw=decode(access.key);access.key='';if(raw.length!==32){raw.fill(0);throw Error('Invalid key');}
        let wrappingKey;try{wrappingKey=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);}finally{raw.fill(0);}
        const iv=decode(bridge.iv),wrapped=decode(bridge.wrappedKey);
        if(bridge.version!==1||iv.length!==12||wrapped.length!==48)throw Error('Invalid bridge');
        const aad=new TextEncoder().encode(`lunarvow-passkey-bridge-v1:${BUILD}:${bridge.archiveId}:${root.pathname}`);
        const archiveKey=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},wrappingKey,wrapped));
        try{if(archiveKey.length!==32)throw Error('Invalid archive key');await openWithKey(encode(archiveKey));}finally{archiveKey.fill(0);}
      }catch(error){failPasskey(error);}
    });
    registerButton?.addEventListener('click',async()=>{
      if(busy||!gateReady||!setupToken||!settings.passkeys||!passkeySupported)return;
      busy=true;statusName='registering';render();
      try{
        const start=await accessRequest('/v1/passkeys/register/options',{token:setupToken});
        const credential=await navigator.credentials.create({publicKey:credentialOptions(start.options,true)});
        const result=await accessRequest('/v1/passkeys/register/verify',{flowId:start.flowId,response:credentialJSON(credential,true)});
        if(result.registered!==true)throw Error('Registration incomplete');
        setupToken='';setupPanel.hidden=true;busy=false;statusName='passkeyRegistered';render();passkeyButton.focus();
      }catch(error){failPasskey(error);}
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !settings || !input.value) return;
      busy = true; submit.disabled = true; statusName = 'busy'; render();
      try {
        const password = input.value.normalize('NFC');
        input.value = '';
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const key = encode(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decode(settings.salt), iterations: settings.iterations, hash: 'SHA-256' }, material, 256));
        await openWithKey(key);
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
      if (!setupToken && saved) {
        const result = await request('VAULT_UNLOCK', saved);
        if (result.ok) { enter(); return; }
        clearKey();
      } else if(!setupToken) {
        const state = await request('VAULT_STATUS');
        if (state.ok && state.build === BUILD) { enter(); return; }
      }
      if(settings.passkeys){
        document.querySelector('[data-vault-passkeys]').hidden=false;
        setupPanel.hidden=!setupToken;
      }
      gateReady=true;input.disabled = false; submit.disabled = false;
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
