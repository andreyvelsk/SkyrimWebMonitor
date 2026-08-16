// Generate SVG from successfully parsed DefineShape shapes.
// Usage: node scripts/gfx/generate.mjs [path/to/file.gfx|.b64] [outdir]
// Accepts a binary GFX file or a base64 file (auto-detected via the CFX signature).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseShapes, decodeGfxFileContent } from './lib.mjs';

const file = process.argv[2] ?? 'public/hudmenu.gfx';
const outdir = process.argv[3] ?? 'scripts/gfx/out/svg';

const data = decodeGfxFileContent(readFileSync(file));
const results = await parseShapes(data);

mkdirSync(outdir, { recursive: true });
let ok = 0;
let failed = 0;
for (const r of results) {
    if (r.svg) {
        writeFileSync(join(outdir, `${r.shapeId}.svg`), r.svg);
        ok++;
    } else {
        failed++;
    }
}
console.log(`SVG generated: ${ok}, errors: ${failed}, total: ${results.length}`);
