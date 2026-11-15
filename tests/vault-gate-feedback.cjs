const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'_vault/config.json'),'utf8'));
const template=fs.readFileSync(path.join(root,'scripts/vault/runtime.js'),'utf8');
const published=fs.readFileSync(path.join(root,'_vault/runtime.js'),'utf8');
assert.equal(published,template.replaceAll('@@BUILD@@',config.build),'published runtime must match its build template');

function element(){
  return {value:'',handlers:{},attributes:{},classes:new Set(),
    addEventListener(type,handler){this.handlers[type]=handler;},
    setAttribute(name,value){this.attributes[name]=value;},
    focus(){this.focused=true;},
    classList:{toggle(){}}
  };
}
async function gate({language='en',search='',hash='',storageBlocked=false,passkeysSupported=true,authenticate,credentialError}={}){
  const selectors=['form','password','password-submit','passkey','passkey-register','passkey-setup','language-select','languages','status','passkeys','passkey-note'];
  const elements=Object.fromEntries(selectors.map(name=>[`[data-vault-${name}]`,element()]));
  const document={
    currentScript:{src:'https://fixture.test/lunarvow/_vault/runtime.js'},
    documentElement:{hasAttribute:()=>false},
    querySelector:selector=>elements[selector]||null,
    querySelectorAll:()=>[]
  };
  class MessageChannel{
    constructor(){
      this.port1={close(){}};
      this.port2={postMessage:data=>queueMicrotask(()=>this.port1.onmessage?.({data}))};
    }
  }
  const controller={postMessage(message,ports){
    assert.equal(message.type,'VAULT_STATUS');
    ports[0].postMessage({ok:false,build:config.build});
  }};
  const settings={format:'lunarvow-vault-v3',build:config.build,compression:'gzip',
    passkeys:{version:1,authOrigin:'https://fixture.workers.dev',archiveId:'fixture-archive'}};
  const location=new URL('https://fixture.test/lunarvow/'+search+hash);
  location.reload=()=>{throw Error('Unexpected navigation');};
  const storage=new Map([['bhr-language',language]]);
  const history={state:{view:'fixture'},replaceState(state,title,url){this.state=state;location.href=new URL(url,location).href;}};
  const context={document,window:{isSecureContext:true,DecompressionStream,PublicKeyCredential:passkeysSupported?class{}:undefined},
    navigator:{serviceWorker:{controller,register:async()=>({}),ready:Promise.resolve(),addEventListener(){}},
      credentials:{get:async()=>{throw credentialError||Error('Unexpected credential prompt');},create:async()=>{throw Error('Unexpected registration');}}},
    location,history,
    localStorage:{getItem:key=>{if(storageBlocked)throw Error('Storage blocked');return storage.get(key)||null;},setItem(key,value){if(storageBlocked)throw Error('Storage blocked');storage.set(key,value);}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    fetch:async url=>new URL(url).hostname==='fixture.test'?{ok:true,json:async()=>settings}:authenticate(url),
    URL,URLSearchParams,crypto:webcrypto,AbortSignal,MessageChannel,TextEncoder,Uint8Array,ArrayBuffer,btoa,atob,setTimeout,clearTimeout
  };
  vm.runInNewContext(published,context,{filename:'_vault/runtime.js'});
  for(let i=0;i<10&&elements['[data-vault-password]'].disabled!==false;i++)await new Promise(setImmediate);
  assert.equal(elements['[data-vault-password]'].disabled,false,'synthetic gate is ready');
  return {
    async passkey(){await elements['[data-vault-passkey]'].handlers.click();},
    async password(){elements['[data-vault-password]'].value='fixture-password';await elements['[data-vault-form]'].handlers.submit({preventDefault(){}});},
    selectLanguage(value){const select=elements['[data-vault-language-select]'];select.value=value;select.handlers.change({target:select});},
    status:()=>elements['[data-vault-status]'].textContent,
    ready:()=>!elements['[data-vault-passkey]'].disabled,
    passwordEnabled:()=>!elements['[data-vault-password]'].disabled&&!elements['[data-vault-password-submit]'].disabled,
    passwordValue:()=>elements['[data-vault-password]'].value,
    note:()=>elements['[data-vault-passkey-note]'].textContent,
    language:()=>document.documentElement.lang,
    savedLanguage:()=>storage.get('bhr-language'),
    url:()=>location.href,
    historyState:()=>history.state
  };
}
const reply=(status,body)=>async()=>({status,ok:status>=200&&status<300,json:async()=>body});
const network='The encrypted files could not be loaded. Check your connection and try again.';
(async()=>{
  for(const [name,authenticate] of [
    ['offline',async()=>{throw new TypeError('Failed to fetch');}],
    ['request timeout',async()=>{throw new DOMException('Timed out','TimeoutError');}],
    ['request aborted',async()=>{throw new DOMException('Aborted','AbortError');}],
    ['invalid JSON',async()=>({status:502,ok:false,json:async()=>{throw new SyntaxError('Invalid JSON');}})],
    ['service unavailable',reply(503,{ok:false,code:'passkey_rejected'})],
    ['missing response',reply(200,null)]
  ]){
    const page=await gate({authenticate});await page.passkey();
    assert.equal(page.status(),network,name+' should describe a connection problem');
    assert(page.ready(),name+' should allow another attempt');
  }
  const denied=await gate({authenticate:reply(401,{ok:false,code:'passkey_rejected'})});await denied.passkey();
  assert.equal(denied.status(),'The passkey could not be verified. Try again with a registered passkey.');
  const throttled=await gate({authenticate:reply(429,{ok:false,code:'rate_limited'})});await throttled.passkey();
  assert.equal(throttled.status(),'Too many passkey requests. Please try again shortly.');
  for(const name of ['NotAllowedError','AbortError']){
    const cancelled=await gate({authenticate:reply(200,{ok:true,options:{challenge:'AQ'}}),credentialError:new DOMException('Cancelled',name)});
    await cancelled.passkey();assert.equal(cancelled.status(),'The passkey request was cancelled or timed out. You can try again.');
  }
  const changed={
    'zh-HK':'檔案已更新，請重新載入再用密碼或通行密鑰解鎖。',
    en:'The archive has changed. Reload and unlock with your password or passkey.',
    'zh-CN':'档案已更新，请重新加载并使用密码或通行密钥解锁。',
    ja:'アーカイブが更新されました。再読み込みしてパスワードまたはパスキーで解除してください。',
    ko:'기록실이 업데이트됐습니다. 새로고침 후 비밀번호 또는 패스키로 잠금을 해제하세요.',
    th:'คลังข้อมูลอัปเดตแล้ว โปรดโหลดหน้าใหม่แล้วใช้รหัสผ่านหรือพาสคีย์เพื่อปลดล็อก',
    ru:'Архив обновился. Перезагрузите страницу и войдите с паролем или ключом доступа.'
  };
  for(const [language,message] of Object.entries(changed)){
    const page=await gate({language,authenticate:reply(409,{ok:false,code:'archive_mismatch'})});await page.passkey();
    assert.equal(page.status(),message,language+' offers both supported sign-in methods after an update');
  }
  const passwordOffline=await gate({authenticate:async()=>{throw TypeError('Failed to fetch');}});await passwordOffline.password();
  assert.equal(passwordOffline.status(),network);assert.equal(passwordOffline.passwordValue(),'');
  const passwordDenied=await gate({authenticate:reply(401,{ok:false,code:'invalid_password'})});await passwordDenied.password();
  assert.equal(passwordDenied.status(),'Incorrect password.');
  const fromLink=await gate({language:'ko',search:'?lang=ja'});
  assert.equal(fromLink.language(),'ja','URL language takes priority over saved language');
  assert.equal(fromLink.savedLanguage(),'ja','URL language carries into later pages');
  const invalidLink=await gate({language:'ko',search:'?lang=unsupported'});
  assert.equal(invalidLink.language(),'ko','unsupported URL language falls back to saved language');
  const invalidSaved=await gate({language:'unsupported',search:'?lang=toString'});
  assert.equal(invalidSaved.language(),'zh-HK','unrecognised languages fall back safely');
  const blockedStorage=await gate({search:'?lang=ru',storageBlocked:true});
  assert.equal(blockedStorage.language(),'ru','URL language works when local storage is blocked');
  const shareable=await gate({search:'?view=cards',hash:'#details'});
  shareable.selectLanguage('ru');
  assert.equal(shareable.language(),'ru');assert.equal(shareable.savedLanguage(),'ru');
  assert.equal(shareable.url(),'https://fixture.test/lunarvow/?view=cards&lang=ru#details','language changes preserve other URL details');
  assert.deepEqual(shareable.historyState(),{view:'fixture'});
  const unavailable={
    'zh-HK':'呢個瀏覽器唔支援通行密鑰。你仍然可以用上方嘅入站密碼登入。',
    en:'This browser does not support passkeys. You can still sign in with the access password above.',
    'zh-CN':'此浏览器不支持通行密钥。你仍可使用上方的入站密码登录。',
    ja:'このブラウザーではパスキーを利用できません。上のアクセスパスワードでログインできます。',
    ko:'이 브라우저에서 패스키를 사용할 수 없습니다. 위의 접속 비밀번호로 로그인할 수 있습니다.',
    th:'เบราว์เซอร์นี้ไม่รองรับพาสคีย์ คุณยังเข้าสู่ระบบด้วยรหัสผ่านด้านบนได้',
    ru:'Этот браузер не поддерживает ключи доступа. Вы можете войти с паролем доступа выше.'
  };
  for(const [language,message] of Object.entries(unavailable)){
    const page=await gate({language,passkeysSupported:false});
    assert.equal(page.ready(),false,'passkey button stays disabled without WebAuthn');
    assert(page.passwordEnabled(),'password login remains available without WebAuthn');
    assert.equal(page.note(),message,language+' explains the available password fallback');
  }
  const passwordOnly=await gate({passkeysSupported:false,authenticate:reply(401,{ok:false,code:'invalid_password'})});
  await passwordOnly.password();assert.equal(passwordOnly.status(),'Incorrect password.');
  assert(passwordOnly.passwordEnabled());
  console.log('PASS gate feedback: connection errors, credential outcomes, seven-language guidance, language links and password fallback without WebAuthn');
})().catch(error=>{console.error(error);process.exitCode=1;});
