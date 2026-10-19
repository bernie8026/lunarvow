const fs = require('node:fs');
const path = require('node:path');
const view = require('../assets/news-view.js');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'data/news.json')));
const now = Date.parse(data.checkedOn+'T12:00:00+08:00');
const generatedData = '/* Generated from data/news.json; run npm run build:news. */\nwindow.BHR_NEWS_DATA = '+JSON.stringify(data)+';\n';
const targets = new Map([['assets/news-data.js',generatedData]]);
for(const [file,mode] of [['index.html','home'],['news.html','archive']]) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const block='<!-- NEWS:START -->\n<div data-news-root data-news-mode="'+mode+'" data-i18n-ignore>\n'+view.shell(data,'zh-HK',mode,{},now)+'\n</div>\n<!-- NEWS:END -->';
  if(!source.includes('<!-- NEWS:START -->')) throw new Error('Missing news marker in '+file);
  let updated=source.replace(/<!-- NEWS:START -->[\s\S]*?<!-- NEWS:END -->/,block);
  if(file==='index.html') updated=updated.replace(/<time data-news-checked datetime="[^"]+">[^<]+<\/time>/,'<time data-news-checked datetime="'+data.checkedOn+'">'+data.checkedOn.replaceAll('-','.')+'</time>');
  targets.set(file,updated);
}
// Related guides and story pages show the same verification date as the feed.
for (const file of fs.readdirSync(root).filter(file=>file.endsWith('.html'))) {
  const source=targets.get(file) || fs.readFileSync(path.join(root,file),'utf8');
  const updated=source.replace(/(<span class="update-tag">)\d{4}-\d{2}-\d{2}( \/\/ OFFICIAL NEWS<\/span>)/g,
    (_,before,after)=>before+data.checkedOn+after);
  if(updated!==source) targets.set(file,updated);
}
for(const [file,content] of targets) {
  const target=path.join(root,file);
  if(process.argv.includes('--check')) {
    if(fs.readFileSync(target,'utf8')!==content) throw new Error(file+' has stale news. Run npm run build:news.');
  } else fs.writeFileSync(target,content);
}
console.log('PASS generated news: '+data.items.length+' announcements checked '+data.checkedOn);
