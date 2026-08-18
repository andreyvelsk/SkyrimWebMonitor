// Extract the shapeId → icon name mapping from a GFX file.
// Runs in Node.js; accepts a binary GFX file or a base64 file (auto-detected).
// Usage: node scripts/gfx/names.mjs [gfx-file|.b64] [output.json] [svgDir?]
//
// Uses the shared lib.mjs library.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseGfx, extractNames, decodeGfxFileContent } from './lib.mjs';

const file = process.argv[2] ?? 'public/hudmenu.gfx';
const outFile = process.argv[3] ?? 'scripts/gfx/out/names.json';

/**
 * Filter for meaningful names.
 */
function isMeaningful(name) {
    if (!name || name.startsWith('$')) return false;
    if (name.includes('.')) return false;
    if (name.length <= 2 && /^[A-Z]$/.test(name)) return false;
    return true;
}

/**
 * Length of the common substring (ignoring numbers).
 */
function commonSubstring(a, b) {
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    let max = 0;
    for (let i = 0; i < s.length; i++) {
        for (let j = i + 10; j <= s.length; j++) {
            if (l.includes(s.substring(i, j))) {
                max = Math.max(max, j - i);
            } else break;
        }
    }
    return max;
}

// ---------- MAIN ----------
const data = decodeGfxFileContent(readFileSync(file));
const { swf } = await parseGfx(data);
const shapeNames = extractNames(swf);

const result = {};
for (const [shapeId, spriteMap] of shapeNames) {
    const names = [...new Set([...spriteMap.values()])].filter(isMeaningful).sort();
    if (names.length > 0) {
        result[shapeId] = names;
    }
}

// Geometric matching: for unnamed shapes, find a similar named one
const svgDir = process.argv[4]; // optional: folder with SVGs from generate.mjs
if (svgDir) {
    const { readFileSync: rfs, readdirSync: rds } = await import('node:fs');
    const { join: pjoin } = await import('node:path');
    try {
        const files = rds(svgDir).filter((f) => f.endsWith('.svg'));
        const geomCache = new Map(); // shapeId → normalized geometry

        function geomSig(svg) {
            const match = svg.match(/ d="([^"]+)"/);
            if (!match) return '';
            // Normalize numbers, keep the command structure
            return match[1].replace(/[-.\d]+/g, '#');
        }

        // Collect signatures for all shapes
        for (const f of files) {
            const id = parseInt(f);
            if (isNaN(id)) continue;
            const svg = rfs(pjoin(svgDir, f), 'utf8');
            geomCache.set(id, geomSig(svg));
        }

        // For unnamed shapes, find a similar named one
        let geomAdded = 0;
        for (const f of files) {
            const id = parseInt(f);
            if (isNaN(id) || result[id]) continue;
            const sig = geomCache.get(id);
            if (!sig) continue;

            let bestId = null;
            let bestLen = 0;
            for (const [nid] of Object.entries(result)) {
                const nsig = geomCache.get(+nid);
                if (!nsig) continue;
                const common = commonSubstring(sig, nsig);
                if (common > bestLen) {
                    bestLen = common;
                    bestId = +nid;
                }
            }
            if (bestId && bestLen > sig.length * 0.3) {
                result[id] = [...result[bestId]];
                geomAdded++;
            }
        }
        if (geomAdded > 0) console.log(`Geometric matching: +${geomAdded} names`);
    } catch (e) {
        console.warn(`Geometric matching failed: ${e.message}`);
    }
}

writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`Saved: ${outFile} (${Object.keys(result).length} shapeIds with names)`);
