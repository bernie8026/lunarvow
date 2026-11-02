'use strict';
// Keep the existing ciphertext and password. Only publish an authenticated,
// wrapped archive key and the public WebAuthn client; owner secrets stay local.
const fs=require('node:fs'),path=require('node:path');
const {readArchive,readPassword,readPasskeyAccess}=require('./build-vault.cjs');
const {createBridge}=require('./passkey-bridge.cjs');
const root=path.resolve(__dirname,'..');
function setup(){
 const password=readPassword();readArchive(root,password);
 const access=readPasskeyAccess();if(!access)throw Error('Private passkey configuration is required.');
 const config=JSON.parse(fs.readFileSync(path.join(root,'_vault/config.json'),'utf8'));
 const basePath='/lunarvow/';config.passkeys=createBridge(config,password,access,basePath);
 const template=name=>fs.readFileSync(path.join(__dirname,'vault',name),'utf8').replaceAll('@@ROOT@@',basePath).replaceAll('@@BUILD@@',config.build).replaceAll('@@AUTH_ORIGIN@@',config.passkeys.authOrigin);
 const html=template('gate.html');
 const updates=new Map();
 for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html')))if(fs.readFileSync(path.join(root,name),'utf8').includes('data-vault-gate'))updates.set(name,html);
 updates.set('unlock.html',html);updates.set('_vault/config.json',JSON.stringify(config)+'\n');
 for(const name of ['runtime.js','gate.css','session.css'])updates.set('_vault/'+name,template(name));
 updates.set('vault-sw.js',template('sw.js'));
 for(const [name,text]of updates){const temp=path.join(root,name+'.passkey-tmp');fs.writeFileSync(temp,text);fs.renameSync(temp,path.join(root,name));}
 console.log(JSON.stringify({passkeyReady:true,updatedPublicFiles:updates.size,ciphertextUnchanged:true}));
}
if(require.main===module)try{setup();}catch{console.error('Passkey setup failed. Check the private password and owner configuration.');process.exitCode=1;}
module.exports={setup};
