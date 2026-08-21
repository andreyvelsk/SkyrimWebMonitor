// Generate self-contained comparison page: reference vs our TTF
// Usage: node scripts/gfx/gen_compare.mjs
import { readFileSync, writeFileSync } from 'fs';

const refTtf = readFileSync('scripts/gfx/out/fonts_swf/7_FuturisXCondCTT.ttf');
const myTtf = readFileSync('scripts/gfx/out/fonts_swf/FuturisXCondCTT/FuturisXCondCTT.ttf');
const refB64 = refTtf.toString('base64');
const myB64 = myTtf.toString('base64');
const refSize = Math.round(refTtf.length / 1024);
const mySize = Math.round(myTtf.length / 1024);

const html = '<!DOCTYPE html>\n' +
'<html lang="ru">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<title>FuturisXCondCTT — Сравнение: эталон vs мой</title>\n' +
'<style>\n' +
'  * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'  body {\n' +
'    font-family: system-ui, -apple-system, sans-serif;\n' +
'    background: #1a1a2e;\n' +
'    color: #e0e0e0;\n' +
'    padding: 30px;\n' +
'  }\n' +
'  h1 { color: #f0c040; font-size: 22px; margin-bottom: 6px; }\n' +
'  p { color: #aaa; font-size: 14px; margin-bottom: 20px; }\n' +
'  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }\n' +
'  .col { background: #16213e; border-radius: 8px; padding: 16px; }\n' +
'  .col h2 { font-size: 16px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #333; }\n' +
'  .col.ref h2 { color: #4c4; }\n' +
'  .col.mine h2 { color: #fa0; }\n' +
'  .sample {\n' +
'    font-size: 48px; padding: 15px; background: #0a0a1a; border-radius: 4px;\n' +
'    margin: 8px 0; line-height: 1.5; word-break: break-all;\n' +
'  }\n' +
'  .sample.big { font-size: 72px; }\n' +
'  .sample.xl { font-size: 96px; }\n' +
'  .info { font-size: 12px; color: #888; margin: 6px 0; }\n' +
'  .verdict { text-align: center; padding: 15px; background: #0f3460; border-radius: 8px; font-size: 15px; margin-top: 20px; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<h1>FuturisXCondCTT — Сравнение</h1>\n' +
'<p>Левая колонка — эталон (оригинальный TTF из Skyrim), правая — мой сгенерированный TTF (opentype.js).</p>\n' +
'\n' +
'<div class="columns">\n' +
'  <div class="col ref">\n' +
'    <h2>📁 Эталон</h2>\n' +
'    <div class="info">Размер: ' + refSize + ' KB</div>\n' +
'    <div class="sample big" style="font-family:\'refFuturis\',serif">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 !@#$%^&*()</div>\n' +
'    <div class="sample big" style="font-family:\'refFuturis\',serif">АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ<br>абвгдеёжзийклмнопрстуфхцчшщъыьэюя</div>\n' +
'    <div class="sample" style="font-family:\'refFuturis\',serif">Привет, мир! Hello, World! 1234567890</div>\n' +
'    <div class="sample xl" style="font-family:\'refFuturis\',serif">АБВГДЕЁЖЗ</div>\n' +
'  </div>\n' +
'  <div class="col mine">\n' +
'    <h2>⚙️ Мой парсер</h2>\n' +
'    <div class="info">Размер: ' + mySize + ' KB</div>\n' +
'    <div class="sample big" style="font-family:\'myFuturis\',serif">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 !@#$%^&*()</div>\n' +
'    <div class="sample big" style="font-family:\'myFuturis\',serif">АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ<br>абвгдеёжзийклмнопрстуфхцчшщъыьэюя</div>\n' +
'    <div class="sample" style="font-family:\'myFuturis\',serif">Привет, мир! Hello, World! 1234567890</div>\n' +
'    <div class="sample xl" style="font-family:\'myFuturis\',serif">АБВГДЕЁЖЗ</div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<div class="verdict">Сравните визуально левую и правую колонки. Если символы выглядят одинаково — конвертация корректна.</div>\n' +
'\n' +
'<style>\n' +
'@font-face {\n' +
'  font-family: \'refFuturis\';\n' +
'  src: url(data:font/ttf;base64,' + refB64 + ') format(\'truetype\');\n' +
'}\n' +
'@font-face {\n' +
'  font-family: \'myFuturis\';\n' +
'  src: url(data:font/ttf;base64,' + myB64 + ') format(\'truetype\');\n' +
'}\n' +
'</style>\n' +
'\n' +
'</body>\n' +
'</html>\n';

writeFileSync('scripts/gfx/out/fonts_swf/compare.html', html);
console.log('compare.html created');
console.log('Reference size:', refSize, 'KB');
console.log('My size:', mySize, 'KB');