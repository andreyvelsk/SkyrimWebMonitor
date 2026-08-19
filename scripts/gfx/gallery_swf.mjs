// Generate a self-contained HTML gallery with all fonts inlined as TTF base64 data URIs.
// TTF via opentype.js works in all modern browsers (Chrome, Firefox, Safari).
// No HTTP server needed — works when opened directly from the filesystem (file://).
// Prior step: run fonts_swf_convert.mjs to generate TTF files.
// Usage: node scripts/gfx/gallery_swf.mjs [fonts_dir] [output.html]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const fontsDir = process.argv[2] ?? 'scripts/gfx/out/fonts_swf';
const outFile = process.argv[3] ?? join(fontsDir, 'gallery.html');

// Discover font subdirectories
const entries = readdirSync(fontsDir, { withFileTypes: true });
const fontDirs = entries
    .filter(e => e.isDirectory() && e.name !== 'Arial')
    .map(e => e.name)
    .sort();

// Load all font data (TTF + JSON)
const fonts = [];
for (const dir of fontDirs) {
    const ttfPath = join(fontsDir, dir, `${dir}.ttf`);
    const jsonPath = join(fontsDir, dir, `${dir}.json`);
    if (!existsSync(ttfPath) || !existsSync(jsonPath)) continue;

    const ttfBuffer = readFileSync(ttfPath);
    const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

    fonts.push({ dir, ttfBuffer, jsonData });
}

// Generate @font-face CSS with inline base64 data URIs
function ttfToDataUri(ttfBuffer) {
    const base64 = ttfBuffer.toString('base64');
    return `data:font/ttf;base64,${base64}`;
}

let fontFaceCss = '';
const fontStyles = new Map(); // dir → fontId

for (const { dir, ttfBuffer, jsonData } of fonts) {
    const fontId = jsonData.fontName.replace(/\s+/g, '');
    const dataUri = ttfToDataUri(ttfBuffer);
    fontFaceCss += `
@font-face {
  font-family: '${fontId}';
  src: url('${dataUri}') format('truetype');
  font-weight: normal;
  font-style: normal;
}`;
    fontStyles.set(dir, fontId);
}

// Build inline JSON data for all fonts
const fontDataArray = fonts.map(({ dir, jsonData }) => {
    const fontId = jsonData.fontName.replace(/\s+/g, '');
    const validCount = jsonData.glyphs.filter(g => g.path && g.path.length > 0).length;
    const minCode = jsonData.glyphs.length > 0
        ? Math.min(...jsonData.glyphs.filter(g => g.code > 0).map(g => g.code))
        : 0;
    const maxCode = jsonData.glyphs.length > 0
        ? Math.max(...jsonData.glyphs.map(g => g.code))
        : 0;

    return {
        dir,
        fontName: jsonData.fontName,
        fontId,
        numGlyphs: jsonData.numGlyphs,
        validCount,
        hasLayout: jsonData.hasLayout,
        charRange: `U+${minCode.toString(16).toUpperCase()}..U+${maxCode.toString(16).toUpperCase()}`,
        glyphs: jsonData.glyphs.map(g => ({
            code: g.code,
            codeHex: g.codeHex || `U+${g.code.toString(16).toUpperCase().padStart(4, '0')}`,
            char: g.char || null,
            hasPath: !!(g.path && g.path.length > 0),
        })),
    };
});

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Skyrim SWF Font Glyph Gallery</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #1a1a2e;
    color: #e0e0e0;
    padding: 20px;
  }
  h1 { font-size: 24px; margin-bottom: 8px; color: #f0c040; }
  p { margin-bottom: 20px; color: #aaa; font-size: 14px; }
  .font-source {
    margin-bottom: 20px;
    padding: 8px 12px;
    background: #0f3460;
    border-radius: 4px;
    font-size: 13px;
    color: #8af;
  }
  .font-block {
    margin-bottom: 10px;
    padding: 12px;
    background: #16213e;
    border-radius: 6px;
  }
  .font-block h3 {
    font-size: 15px;
    margin-bottom: 8px;
    color: #e0e0e0;
  }
  .font-block .info {
    font-size: 12px;
    color: #888;
    margin-bottom: 8px;
  }
  .glyph-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    background: #0a0a1a;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    max-height: 480px;
    overflow-y: auto;
  }
  .glyph-cell {
    width: 48px;
    height: 54px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1e2a4a;
    font-size: 22px;
    color: #ddd;
    position: relative;
    cursor: default;
  }
  .glyph-cell:hover {
    background: #2a3a5a;
    z-index: 1;
    transform: scale(1.3);
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .glyph-cell .code {
    font-size: 7px;
    color: #667;
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-family: monospace;
  }
  .glyph-cell.missing {
    background: #1a1a2e;
    color: #444;
  }
  .glyph-cell.missing .code { color: #333; }
  .controls {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #1a1a2e;
    padding: 10px 0;
    margin-bottom: 10px;
    border-bottom: 1px solid #333;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .controls select, .controls input {
    background: #16213e;
    color: #e0e0e0;
    border: 1px solid #444;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 13px;
  }
  .controls label { font-size: 13px; }
  .test-text {
    margin-top: 8px;
    padding: 12px;
    background: #0a0a1a;
    border-radius: 4px;
    font-size: 16px;
    line-height: 1.6;
    word-break: break-all;
  }
  .test-text span {
    display: inline-block;
    min-width: 1.2em;
    text-align: center;
    padding: 0 2px;
  }
  .test-text span:hover {
    background: #2a3a5a;
    border-radius: 2px;
  }
  details { margin-top: 6px; }
  details summary {
    cursor: pointer;
    font-size: 13px;
    color: #8af;
    padding: 4px 0;
  }
  ${fontFaceCss}
</style>
</head>
<body>

<h1>Skyrim SWF Font Glyph Gallery</h1>
<p>
  Шрифты, извлечённые из <code>fonts_ru.swf</code> (Skyrim).
  Все шрифты встроены в страницу как TTF base64 — работает в любом современном
  браузере без HTTP-сервера.
  Наведите на глиф — он увеличится. Ниже — тестовый текст каждым шрифтом.
</p>

<div class="font-source">
  Источник: <code>public/fonts_ru.swf</code> (FWS SWF v10, 643 КБ, ${fonts.length} шрифтов).
  Конвертация: <code>fonts_swf.mjs</code> → <code>fonts_swf_convert.mjs</code> (opentype.js) → <code>gallery_swf.mjs</code>
</div>

<div class="controls">
  <label>Фильтр: <input type="text" id="filterInput" placeholder="code (hex) or char..." oninput="filterGlyphs()"></label>
  <label>Показать: <select id="showSelect" onchange="filterGlyphs()">
    <option value="all">Все глифы</option>
    <option value="printable">Только печатные (code ≥ 32)</option>
    <option value="cyrillic">Только кириллица (U+0400–U+04FF)</option>
    <option value="cyrillic-ext">Кириллица + Latin Extended</option>
    <option value="latin">Только Latin (U+0020–U+007E)</option>
    <option value="missing">Пропущенные/пустые</option>
  </select></label>
</div>

<div id="fontsContainer"></div>

<script>
const FONT_DATA = ${JSON.stringify(fontDataArray)};

function buildGallery() {
  const container = document.getElementById('fontsContainer');

  for (const fd of FONT_DATA) {
    const block = document.createElement('div');
    block.className = 'font-block';

    const info = document.createElement('div');
    info.className = 'info';
    info.textContent = \`\${fd.validCount}/\${fd.numGlyphs} глифов, коды: \${fd.charRange}\${fd.hasLayout ? ', имеет layout' : ''}\`;
    block.appendChild(info);

    const title = document.createElement('h3');
    title.textContent = fd.fontName;
    const subtitle = document.createElement('span');
    subtitle.style.cssText = 'font-weight:normal;font-size:13px;color:#888;margin-left:8px';
    subtitle.textContent = '(' + fd.dir + ')';
    title.appendChild(subtitle);
    block.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'glyph-grid';

    for (const g of fd.glyphs) {
      const cell = document.createElement('div');
      cell.className = 'glyph-cell' + (g.hasPath ? '' : ' missing');
      cell.setAttribute('data-code', g.code);
      cell.setAttribute('data-char', g.char || '');
      cell.setAttribute('data-has-path', g.hasPath ? '1' : '0');

      if (g.hasPath) {
        const ch = g.code <= 0xffff ? String.fromCodePoint(g.code) : '\\uFFFD';
        cell.textContent = ch;
        cell.style.fontFamily = "'" + fd.fontId + "', serif";
      } else {
        cell.textContent = '·';
        cell.style.color = '#333';
      }

      const label = document.createElement('span');
      label.className = 'code';
      label.textContent = g.codeHex;
      cell.appendChild(label);
      grid.appendChild(cell);
    }

    const details = document.createElement('details');
    details.open = FONT_DATA.indexOf(fd) < 3;
    details.innerHTML = '<summary>Показать глифы (' + fd.numGlyphs + ')</summary>';
    details.appendChild(grid);
    block.appendChild(details);

    const printable = fd.glyphs.filter(g => g.code >= 32 && g.hasPath);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-text';
    testDiv.style.fontFamily = "'" + fd.fontId + "', serif";

    let testHtml = '';
    for (const g of printable) {
      const ch = g.code <= 0xffff ? String.fromCodePoint(g.code) : '\\uFFFD';
      testHtml += '<span style="font-family:\\'' + fd.fontId + '\\',serif" title="' + g.codeHex + '">' + ch + '</span>';
    }
    testDiv.innerHTML = testHtml || '<span style="color:#666">Нет печатных глифов</span>';

    const testDetails = document.createElement('details');
    testDetails.innerHTML = '<summary>Тестовый текст (' + printable.length + ' печатных символов)</summary>';
    testDetails.appendChild(testDiv);
    block.appendChild(testDetails);

    container.appendChild(block);
  }
}

function filterGlyphs() {
  const filter = document.getElementById('filterInput').value.trim().toLowerCase();
  const showMode = document.getElementById('showSelect').value;

  document.querySelectorAll('.glyph-cell').forEach(cell => {
    const code = parseInt(cell.getAttribute('data-code'));
    const char = (cell.getAttribute('data-char') || '').toLowerCase();
    const hasPath = cell.getAttribute('data-has-path') === '1';
    const codeHex = code.toString(16).padStart(4, '0');

    let matchesSearch = true;
    if (filter) {
      if (/^[0-9a-f]{1,4}$/i.test(filter)) {
        matchesSearch = codeHex.includes(filter.toLowerCase().padStart(4, '0'));
      } else {
        matchesSearch = char.includes(filter) || codeHex.includes(filter);
      }
    }

    let matchesMode = true;
    switch (showMode) {
      case 'printable': matchesMode = code >= 32; break;
      case 'cyrillic': matchesMode = code >= 0x0400 && code <= 0x04FF; break;
      case 'cyrillic-ext': matchesMode = (code >= 0x0400 && code <= 0x052F) || (code >= 0x0020 && code <= 0x00FF); break;
      case 'latin': matchesMode = code >= 0x0020 && code <= 0x007E; break;
      case 'missing': matchesMode = !hasPath; break;
    }

    cell.style.display = matchesSearch && matchesMode ? '' : 'none';
  });
}

buildGallery();
</script>

</body>
</html>`;

writeFileSync(outFile, html);
const totalSizeKb = Math.round(html.length / 1024);
console.log(`Gallery created: ${outFile}`);
console.log(`Fonts inlined: ${fonts.length}`);
console.log(`Page size: ${totalSizeKb} KB (self-contained TTF base64)`);