const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/vendor/opencc/hk2cn.js'), 'utf8'), {window});
const convert = window.OpenCC.Converter({from: 'hk', to: 'cn'});
for (const [input, expected] of [
  ['月下誓約・予愛以心', '月下誓约・予爱以心'],
  ['電腦與角色圖鑑', '电脑与角色图鉴'],
  ['乾隆乾坤乾燥', '乾隆乾坤干燥'],
  ['頭髮發展', '头发发展'],
  ['衞生與著作', '卫生与著作'],
  ['月下🌙 HONKAI 3', '月下🌙 HONKAI 3']
]) assert.equal(convert(input), expected);
console.log('PASS OpenCC: local Hong Kong conversion, phrase exceptions and supplementary characters');
