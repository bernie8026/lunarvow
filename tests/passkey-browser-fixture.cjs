'use strict';
const assert=require('node:assert/strict');
const {createHash,createPublicKey,randomBytes,randomUUID,verify}=require('node:crypto');

// This API exists only in the browser test's request interceptor. It checks
// the challenge and a real Chrome virtual authenticator's signed assertion;
// it does not stand in for a production Worker or a physical Apple device.
function fixtureAccess(){
  return {archiveId:randomUUID(),archiveKeyB64:randomBytes(32).toString('base64'),authOrigin:'https://lunarvow-test.workers.dev'};
}

async function gate(page){
  await page.locator('[data-vault-gate]').waitFor();
  assert.equal(await page.locator('input[type=password], [data-vault-password], [data-vault-submit]').count(),0);
  await page.locator('[data-vault-passkey]:enabled').waitFor();
}

async function unlock(page){
  await gate(page);
  await page.locator('[data-vault-passkey]').click();
  await page.locator('[data-vault-content]').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.readyState==='complete'&&window.BHR_I18N&&!document.documentElement.hasAttribute('data-vault-pending'));
}

async function attachPasskey(context,page,base,access){
  const origin=new URL(base).origin;
  const rpId=new URL(base).hostname;
  const invite=randomBytes(32).toString('base64url');
  const userId=randomBytes(32).toString('base64url');
  const events=[];
  const flows=new Map();
  const credentials=new Map();
  const cdp=await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable',{enableUI:false});
  const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
  let unusedInvite=true;
  const hash=value=>createHash('sha256').update(value).digest();
  await context.route('**/*',async route=>{
    const req=route.request();const url=new URL(req.url());
    if(url.origin===origin)return route.continue();
    if(url.origin!==access.authOrigin)return route.abort();
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
    const reply=(status,value)=>route.fulfill({status,headers,json:value});
    const reject=(status,code)=>reply(status,{ok:false,code});
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
    events.push(url.pathname);
    try{
      if(req.method()!=='POST'||req.headers().origin!==origin)return reject(403,'origin_mismatch');
      const data=req.postDataJSON();
      if(data.archiveId!==access.archiveId)return reject(400,'archive_mismatch');
      const [,type,operation]=/^\/v1\/passkeys\/(register|auth)\/(options|verify)$/.exec(url.pathname)||[];
      if(!operation)return reject(404,'no_endpoint');
      if(operation==='options'){
        if(type==='register'&&(!unusedInvite||data.token!==invite))return reject(403,'invite_invalid');
        if(type==='auth'&&!credentials.size)return reject(404,'no_passkeys');
        const challenge=randomBytes(32).toString('base64url'),flowId=randomUUID();
        flows.set(flowId,{type,challenge});
        const options=type==='register'?{challenge,rp:{id:rpId,name:'Lunar Vow fixture'},user:{id:userId,name:'fixture',displayName:'Fixture'},pubKeyCredParams:[{type:'public-key',alg:-7}],attestation:'none'}:{challenge,rpId};
        return reply(200,{ok:true,flowId,options});
      }
      const flow=flows.get(data.flowId);flows.delete(data.flowId);
      const cred=data.response, signed=cred.response;
      const clientData=Buffer.from(signed.clientDataJSON,'base64url');
      const client=JSON.parse(clientData);
      if(!flow||flow.type!==type||client.origin!==origin||client.crossOrigin||client.challenge!==flow.challenge||client.type!==(type==='register'?'webauthn.create':'webauthn.get')||cred.type!=='public-key'||cred.rawId!==cred.id)return reject(403,'invalid_assertion');
      if(type==='register'){
        if(!unusedInvite||!signed.attestationObject)return reject(403,'invite_invalid');
        const virtual=(await cdp.send('WebAuthn.getCredentials',{authenticatorId})).credentials.find(item=>Buffer.from(item.credentialId,'base64').toString('base64url')===cred.id);
        if(!virtual?.isResidentCredential||virtual.rpId!==rpId)return reject(403,'invalid_attestation');
        credentials.set(cred.id,createPublicKey({key:Buffer.from(virtual.privateKey,'base64'),format:'der',type:'pkcs8'}));
        unusedInvite=false;
        return reply(200,{ok:true,registered:true});
      }
      const publicKey=credentials.get(cred.id);
      const authData=Buffer.from(signed.authenticatorData,'base64url');
      if(!publicKey||authData.length<37||!authData.subarray(0,32).equals(hash(rpId))||(authData[32]&5)!==5||signed.userHandle!==userId||!verify('sha256',Buffer.concat([authData,hash(clientData)]),publicKey,Buffer.from(signed.signature,'base64url')))return reject(403,'invalid_assertion');
      return reply(200,{ok:true,archiveId:access.archiveId,key:access.archiveKeyB64});
    }catch{return reject(400,'invalid_fixture_request');}
  });
  async function enroll(){
    await page.goto(base+'unlock.html#passkey-setup='+invite);
    await gate(page);
    assert.equal(new URL(page.url()).hash,'');
    const button=page.locator('[data-vault-passkey-register]:enabled');
    await button.click();
    await page.locator('[data-vault-passkey-setup]').waitFor({state:'hidden'});
    assert.equal(credentials.size,1);
    assert.equal(await page.locator('[data-vault-content]').count(),0,'registration alone does not unlock');
  }
  return {enroll,events,cdp,authenticatorId,invite};
}

module.exports={fixtureAccess,gate,unlock,attachPasskey};
