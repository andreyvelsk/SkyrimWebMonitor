import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';

const RELEASE_TYPES = new Set(['patch', 'minor', 'major']);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, options = {}) {
    execFileSync(command, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        ...options,
    });
}

function getStdout(command) {
    return execSync(command, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

function fail(message) {
    console.error(`release: ${message}`);
    process.exit(1);
}

function ensureMainBranch() {
    const branch = getStdout('git branch --show-current');
    if (branch !== 'main') {
        fail(`command is allowed only on main, current branch: ${branch || 'detached HEAD'}`);
    }
}

function ensureCleanWorktree() {
    const status = getStdout('git status --porcelain');
    if (status) {
        fail('working tree is not clean; commit or stash changes before releasing');
    }
}

function readPackageVersion() {
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
}

function main() {
    const requestedType = process.argv[2] || 'patch';
    if (!RELEASE_TYPES.has(requestedType)) {
        fail(`unsupported release type: ${requestedType}. Use patch, minor, or major.`);
    }

    ensureMainBranch();
    ensureCleanWorktree();

    run('npm', ['run', 'tsc']);
    run('npm', ['run', 'build']);
    run('npm', ['version', requestedType, '-m', 'chore(release): %s']);

    const version = readPackageVersion();
    run('git', ['push', 'origin', 'main', '--follow-tags']);

    console.log(`release: published v${version}`);
}

main();