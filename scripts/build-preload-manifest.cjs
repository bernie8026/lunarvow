const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function buildManifest(files, characters, musicSource, languageSource) {
  const image = /\.(?:png|jpe?g|webp|avif|gif|svg)$/i;
  const runtime = /\.(?:html|css|js|json|png|jpe?g|webp|avif|gif|svg|mp3|webm|woff2?)$/i;
  const musicFile = musicSource.match(/const SOURCE_FILE = '([^']+)'/)[1];
  const musicVersion = musicSource.match(/const SOURCE_VERSION = '([^']+)'/)[1];
  const urls = files.filter(file => !/^(?:\.|tests\/|scripts\/|node_modules\/)/.test(file) &&
    runtime.test(file) && !['package.json', 'package-lock.json', 'assets/preload-manifest.json'].includes(file));
  urls.push(`${musicFile}?v=${musicVersion}`);
  urls.push(...characters.map(character => character.image).filter(Boolean));
  urls.push(...(languageSource.match(/https:\/\/cdn\.jsdelivr\.net\/[^'"\s]+/g) || []));
  return { resources: [...new Set(urls)].sort().map(url => ({ url,
    type: image.test(url.split('?')[0]) ? 'image' : 'fetch'
  })) };
}

function walk(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', 'tests', 'scripts'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [path.relative(root, file).split(path.sep).join('/')];
  });
}
if (require.main === module) {
  const manifest = buildManifest(walk(), JSON.parse(fs.readFileSync(path.join(root, 'data/characters.json'))),
    fs.readFileSync(path.join(root, 'assets/music-player.js'), 'utf8'), fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8'));
  const target = path.join(root, 'assets/preload-manifest.json');
  const output = JSON.stringify(manifest, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(target, 'utf8') !== output) throw new Error('Preload manifest is stale. Run npm run build:preload.');
  } else fs.writeFileSync(target, output);
}
module.exports = { buildManifest };
