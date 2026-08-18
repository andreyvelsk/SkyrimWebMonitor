// Inspect the structure of Scaleform GFX (Skyrim HUD).
// Usage: node scripts/gfx/inspect.mjs [path/to/file.gfx|.b64] [shapeId|--stats|--export]
// Accepts a binary GFX file or a base64 file (auto-detected via the CFX signature).
import { readFileSync } from 'node:fs';
import {
    parseGfx,
    parseDefineShape,
    colorToCss,
    readU32LE,
    segmentsToD,
    decodeGfxFileContent,
} from './lib.mjs';

const file = process.argv[2] ?? 'public/hudmenu.gfx';
const mode = process.argv[3] ?? '';

const data = decodeGfxFileContent(readFileSync(file));
const { gfx, swf, header, exports, shapes } = await parseGfx(data);

const sig = String.fromCharCode(gfx[0], gfx[1], gfx[2]);
const version = gfx[3];
const declaredSize = readU32LE(gfx, 4);
console.log(`File: ${file}`);
console.log(`Signature: ${sig}, version: ${version}, declared size: ${declaredSize}`);
console.log(`Decompressed: ${swf.length} bytes\n`);

const frameSize = header.frameSize;
console.log(`FrameSize: ${frameSize.xmax}x${frameSize.ymax} twips (${frameSize.xmax / 20}x${frameSize.ymax / 20}px @ 20 twips/px)`);
console.log(`FrameRate: ${header.frameRate} fps, FrameCount: ${header.frameCount}\n`);

const TAG_NAMES = {
    0: 'End', 1: 'ShowFrame', 2: 'DefineShape', 4: 'PlaceObject',
    5: 'RemoveObject', 6: 'DefineBits', 7: 'DefineButton', 8: 'JPEGTables',
    9: 'SetBackgroundColor', 10: 'DefineFont', 11: 'DefineText',
    12: 'DoAction', 13: 'DefineFontInfo', 14: 'DefineSound',
    15: 'StartSound', 17: 'DefineButtonSound', 18: 'SoundStreamHead',
    19: 'SoundStreamBlock', 20: 'DefineBitsLossless', 21: 'DefineBitsJPEG2',
    22: 'DefineShape2', 23: 'DefineButtonCxform', 24: 'Protect',
    26: 'PlaceObject2', 28: 'RemoveObject2', 32: 'DefineShape3',
    33: 'DefineText2', 34: 'DefineButton2', 35: 'DefineBitsJPEG3',
    36: 'DefineBitsLossless2', 37: 'DefineEditText', 39: 'DefineSprite',
    43: 'FrameLabel', 45: 'SoundStreamHead2', 46: 'DefineMorphShape',
    48: 'DefineFont2', 56: 'ExportAssets', 57: 'ImportAssets',
    58: 'EnableDebugger', 59: 'DoInitAction', 60: 'DefineVideoStream',
    61: 'VideoFrame', 62: 'DefineFontInfo2', 64: 'EnableDebugger2',
    65: 'ScriptLimits', 66: 'SetTabIndex', 69: 'FileAttributes',
    70: 'PlaceObject3', 71: 'ImportAssets2', 73: 'DefineFontAlignZones',
    74: 'CSMTextSettings', 75: 'DefineFont3', 76: 'SymbolClass',
    77: 'Metadata', 78: 'DefineScalingGrid', 82: 'DoABC',
    83: 'DefineShape4', 84: 'DefineMorphShape2', 86: 'DefineSceneAndFrameLabelData',
    87: 'DefineBinaryData', 88: 'DefineFontName', 89: 'StartSound2',
    90: 'DefineBitsJPEG4', 91: 'DefineFont4',
};

console.log(`Exported symbols: ${exports.size}`);
console.log(`DefineShape tags: ${shapes.length}\n`);

if (mode === '--export') {
    for (const [id, name] of exports) console.log(`${id}\t${name}`);
} else if (mode === '--stats') {
    const ok = [];
    const failed = [];
    const reasons = new Map();
    for (const s of shapes) {
        try {
            const p = parseDefineShape(swf, s.dataStart, s.code, { groupOnStyleChange: true });
            ok.push({ ...s, contours: p.contours.length, fills: p.fills.length });
        } catch (e) {
            const reason = e.message;
            reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
            failed.push({ ...s, reason: e.message });
        }
    }
    console.log(`Successfully parsed: ${ok.length} / ${shapes.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log('\nError reasons:');
    for (const [reason, count] of reasons) console.log(`  ${count}x ${reason}`);
    console.log('\nFailed examples:');
    for (const f of failed.slice(0, 10)) console.log(`  shapeId=${f.shapeId} ${TAG_NAMES[f.code]} len=${f.len}: ${f.reason}`);
} else {
    // Print the first 30 names and parse the selected/first shape
    console.log('First 30 exported symbols:');
    let idx = 0;
    for (const [id, name] of exports) {
        if (idx++ >= 30) break;
        console.log(`  ${id}\t${name}`);
    }
    console.log('...');

    let target = shapes[0];
    if (mode && /^\d+$/.test(mode)) {
        target = shapes.find((s) => s.shapeId === Number(mode)) ?? shapes[0];
    }
    console.log(`\nShape parse: shapeId=${target.shapeId} (tag #${target.tagIndex}, ${TAG_NAMES[target.code]}, len=${target.len})`);
    const parsed = parseDefineShape(swf, target.dataStart, target.code, { groupOnStyleChange: true });
    console.log(`Bounds: ${JSON.stringify(parsed.bounds)}`);
    console.log(`Fill styles: ${parsed.fills.length}, Line styles: ${parsed.lines.length}`);
    for (let i = 0; i < parsed.fills.length; i++) {
        const f = parsed.fills[i];
        console.log(`  fill[${i}] ${f.type} ${f.color ? colorToCss(f.color) : `${f.records?.length ?? 0} gradients`}`);
    }
    for (let i = 0; i < parsed.lines.length; i++) {
        console.log(`  line[${i}] width=${parsed.lines[i].width} ${colorToCss(parsed.lines[i].color)}`);
    }
    console.log(`Contours: ${parsed.contours.length}`);
    const paths = contoursToSvgPaths(parsed.contours);
    console.log(`SVG paths: ${paths.length}`);
    for (const p of paths.slice(0, 5)) {
        console.log(`  fill=${p.fill} stroke=${p.stroke} d=${p.d.slice(0, 80)}...`);
    }
}

// Highlight contours for display (as in the original inspect.mjs)
function contoursToSvgPaths(contours, scale = 1 / 20, offsetX = 0, offsetY = 0) {
    const out = [];
    for (const c of contours) {
        if (!c.segments.length) continue;
        const fill = c.fill0 !== 0;
        const stroke = c.line !== 0;
        const d = segmentsToD(c.segments, scale, offsetX, offsetY);
        out.push({ d, fill: fill ? c.fill0 : 0, stroke: stroke ? c.line : 0 });
    }
    return out;
}
