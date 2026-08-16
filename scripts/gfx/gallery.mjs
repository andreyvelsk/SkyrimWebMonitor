// Generate an HTML gallery for visual SVG comparison.
// Usage: node scripts/gfx/gallery.mjs [mydir] [refdir] [out.html] [names.json]
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const myDir = process.argv[2] ?? 'scripts/gfx/out/svg';
const refDir = process.argv[3] ?? 'scripts/gfx/out/ref';
const outFile = process.argv[4] ?? 'scripts/gfx/out/gallery.html';
const namesFile = process.argv[5] ?? 'scripts/gfx/out/names.json';

// Load icon names
let namesMap = {};
try {
    namesMap = JSON.parse(readFileSync(namesFile, 'utf8'));
} catch {
    console.warn(`Names file not found: ${namesFile}`);
}

const files = readdirSync(myDir).filter((f) => f.endsWith('.svg')).sort((a, b) => {
    return parseInt(a) - parseInt(b);
});

const items = files
    .map((f) => {
        const mySvg = readFileSync(join(myDir, f), 'utf8');
        const refSvg = existsSync(join(refDir, f)) ? readFileSync(join(refDir, f), 'utf8') : null;
        return { name: f.replace('.svg', ''), mySvg, refSvg };
    })
    .map(({ name, mySvg, refSvg }) => {
        const myInner = extractSvgInner(mySvg);
        const refInner = refSvg ? extractSvgInner(refSvg) : '<p>no reference</p>';
        const iconNames = namesMap[name] || [];
        const title = iconNames.length > 0 ? `${name} — ${iconNames.join(', ')}` : name;
        return `
    <div class="item">
      <div class="title">${title}</div>
      <div class="pair">
        <div class="cell mine">${myInner}</div>
        <div class="cell ref">${refInner}</div>
      </div>
    </div>`;
    })
    .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GFX SVG Gallery (${items ? files.length : 0} shapes)</title>
<style>
  body { font-family: sans-serif; background: #1e1e1e; color: #ccc; margin: 0; padding: 20px; }
  h1 { font-size: 18px; }
  .hint { color: #888; font-size: 12px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .item { background: #2a2a2a; border: 1px solid #444; border-radius: 6px; overflow: hidden; }
  .title { padding: 6px 8px; font-size: 13px; font-weight: bold; background: #333; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; }
  .cell { padding: 6px; min-height: 120px; display: flex; align-items: center; justify-content: center; }
  .cell.mine { background: #20202a; }
  .cell.ref { background: #2a2020; border-left: 1px solid #444; }
  .cell svg { max-width: 100%; max-height: 110px; width: auto; height: auto; }
  .label { font-size: 10px; color: #999; text-align: center; padding: 2px; }
</style>
</head>
<body>
<h1>GFX SVG Gallery — ${files.length} shapes</h1>
<p class="hint">Left — my parser, right — JPEXS reference. Gray background — mine, dark red — reference.</p>
<div class="grid">
${items}
</div>
</body>
</html>`;

function extractSvgInner(svg) {
    const m = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!m) return svg;
    const inner = m[1];
    const width = (svg.match(/width="([^"]+)"/)?.[1] ?? '').replace('px', '');
    const height = (svg.match(/height="([^"]+)"/)?.[1] ?? '').replace('px', '');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${inner}</svg>`;
}

writeFileSync(outFile, html);
console.log(`Gallery created: ${outFile} (${files.length} shapes)`);
