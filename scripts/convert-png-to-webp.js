import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WEBP_MAX_DIMENSION = 16383;

/**
 * Usage examples:
 * npm run convert:webp -- --input public/skyrim10.png --output public/skyrim10.webp --quality 82
 * npm run convert:webp -- --input public/map-tiles-png --output public/map-tiles --recursive --quality 80
 */

function parseArgs(argv) {
    const args = {
        input: '',
        output: '',
        quality: 82,
        recursive: false,
        effort: 4,
        fitWebpLimit: false,
    };

    for (let i = 2; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--input' && argv[i + 1]) {
            args.input = argv[++i];
        } else if (token === '--output' && argv[i + 1]) {
            args.output = argv[++i];
        } else if (token === '--quality' && argv[i + 1]) {
            args.quality = Number(argv[++i]);
        } else if (token === '--effort' && argv[i + 1]) {
            args.effort = Number(argv[++i]);
        } else if (token === '--recursive') {
            args.recursive = true;
        } else if (token === '--fit-webp-limit') {
            args.fitWebpLimit = true;
        } else if (token === '--help' || token === '-h') {
            args.help = true;
        }
    }

    return args;
}

function printHelp() {
    console.log(`PNG -> WebP converter\n\nUsage:\n  node scripts/convert-png-to-webp.js --input <file-or-dir> [--output <file-or-dir>] [--quality 82] [--effort 4] [--recursive] [--fit-webp-limit]\n\nExamples:\n  node scripts/convert-png-to-webp.js --input public/skyrim10.png --output public/skyrim10.webp --quality 82\n  node scripts/convert-png-to-webp.js --input public/map-tiles-png --output public/map-tiles --recursive --quality 80\n  node scripts/convert-png-to-webp.js --input public/very-big-map.png --output public/map.webp --fit-webp-limit\n\nNotes:\n  - For a single file, output defaults to same name with .webp extension.\n  - For a directory, output defaults to the same directory.\n  - quality: 1..100 (default 82)\n  - effort: 0..6   (default 4)\n  - --fit-webp-limit: auto-resizes oversized images to WebP max dimensions (${WEBP_MAX_DIMENSION}x${WEBP_MAX_DIMENSION}).`);
}

function clamp(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(value)));
}

async function exists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function collectPngFiles(rootDir, recursive) {
    const result = [];

    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (recursive) await walk(full);
                continue;
            }
            if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
                result.push(full);
            }
        }
    }

    await walk(rootDir);
    return result;
}

async function convertOneFile(inputFile, outputFile, quality, effort) {
    await ensureDir(path.dirname(outputFile));
    const source = sharp(inputFile, { limitInputPixels: false });
    const meta = await source.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width > WEBP_MAX_DIMENSION || height > WEBP_MAX_DIMENSION) {
        throw new Error(
            `WEBP_SIZE_LIMIT:${width}x${height}`
        );
    }

    await source.webp({ quality, effort }).toFile(outputFile);
}

async function convertOneFileFitWebpLimit(inputFile, outputFile, quality, effort) {
    await ensureDir(path.dirname(outputFile));
    const source = sharp(inputFile, { limitInputPixels: false });
    const meta = await source.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    const needResize = width > WEBP_MAX_DIMENSION || height > WEBP_MAX_DIMENSION;

    let pipeline = sharp(inputFile, { limitInputPixels: false });
    if (needResize) {
        pipeline = pipeline.resize({
            width: WEBP_MAX_DIMENSION,
            height: WEBP_MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
        });
    }

    await pipeline.webp({ quality, effort }).toFile(outputFile);
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help || !args.input) {
        printHelp();
        process.exit(args.help ? 0 : 1);
    }

    const quality = clamp(args.quality, 1, 100, 82);
    const effort = clamp(args.effort, 0, 6, 4);

    const inputPath = path.resolve(process.cwd(), args.input);
    const inputExists = await exists(inputPath);
    if (!inputExists) {
        console.error(`[convert-png-to-webp] Input not found: ${inputPath}`);
        process.exit(1);
    }

    const inputStat = await fs.stat(inputPath);

    if (inputStat.isFile()) {
        if (!inputPath.toLowerCase().endsWith('.png')) {
            console.error('[convert-png-to-webp] Input file must be a .png');
            process.exit(1);
        }

        const outputPath = args.output
            ? path.resolve(process.cwd(), args.output)
            : inputPath.replace(/\.png$/i, '.webp');

        if (args.fitWebpLimit) {
            await convertOneFileFitWebpLimit(inputPath, outputPath, quality, effort);
        } else {
            await convertOneFile(inputPath, outputPath, quality, effort);
        }
        console.log(`[convert-png-to-webp] OK: ${inputPath} -> ${outputPath}`);
        return;
    }

    if (!inputStat.isDirectory()) {
        console.error('[convert-png-to-webp] Input must be a file or directory');
        process.exit(1);
    }

    const pngFiles = await collectPngFiles(inputPath, args.recursive);
    if (!pngFiles.length) {
        console.log('[convert-png-to-webp] No .png files found');
        return;
    }

    const outputRoot = args.output
        ? path.resolve(process.cwd(), args.output)
        : inputPath;

    let converted = 0;
    for (const file of pngFiles) {
        const rel = path.relative(inputPath, file);
        const outRel = rel.replace(/\.png$/i, '.webp');
        const outputFile = path.join(outputRoot, outRel);
        if (args.fitWebpLimit) {
            await convertOneFileFitWebpLimit(file, outputFile, quality, effort);
        } else {
            await convertOneFile(file, outputFile, quality, effort);
        }
        converted += 1;
    }

    console.log(`[convert-png-to-webp] Converted ${converted} file(s)`);
}

main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith('WEBP_SIZE_LIMIT:')) {
        const size = message.replace('WEBP_SIZE_LIMIT:', '');
        console.error(`[convert-png-to-webp] Failed: image ${size} exceeds WebP max dimension ${WEBP_MAX_DIMENSION}.`);
        console.error('[convert-png-to-webp] Options:');
        console.error('[convert-png-to-webp] 1) Add --fit-webp-limit to auto-resize to WebP limits.');
        console.error('[convert-png-to-webp] 2) Use tiled mode: npm run split:image -- --input <image> --output public/map-tiles --tile-size 1024 --format webp');
        process.exit(1);
    }
    if (/pixel limit/i.test(message)) {
        console.error('[convert-png-to-webp] Failed: input image exceeds default pixel limit.');
        console.error('[convert-png-to-webp] The script now reads large images with limitInputPixels=false.');
        console.error('[convert-png-to-webp] Retry the same command.');
    } else {
        console.error('[convert-png-to-webp] Failed:', message);
    }
    process.exit(1);
});
