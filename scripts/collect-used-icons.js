import fs from 'node:fs';
import path from 'node:path';

// Scans src/** for string literals matching '<author>/<name>.svg' and returns
// a sorted, de-duplicated list of icon paths (relative to public/icons/).
// Server payloads do not contain icon paths — every icon used in the app is
// referenced from source code, so this static scan is exhaustive.

const ICON_REGEX = /['"`]([a-z0-9-]+\/[a-z0-9-]+\.svg)['"`]/gi;

function walk(dir, acc) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, acc);
        } else if (/\.(vue|ts|tsx|js|jsx)$/.test(entry.name)) {
            acc.push(full);
        }
    }
    return acc;
}

export function collectUsedIcons(srcDir, publicIconsDir) {
    const files = walk(srcDir, []);
    const found = new Set();
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        for (const match of content.matchAll(ICON_REGEX)) {
            found.add(match[1]);
        }
    }

    // Drop any matches that don't actually exist on disk (false positives).
    const result = [];
    for (const rel of found) {
        if (fs.existsSync(path.join(publicIconsDir, rel))) {
            result.push(rel);
        }
    }
    result.sort();
    return result;
}
