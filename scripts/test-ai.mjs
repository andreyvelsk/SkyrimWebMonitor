/**
 * Compact test reporter for AI agents.
 * Runs vitest and outputs minimal token-efficient summary:
 * - Success: "✅ All N tests passed in M files"
 * - Failure: only failed test names and error messages
 */
import { spawn } from 'node:child_process';

const vitest = spawn(
    'npx',
    ['vitest', 'run', '--reporter=json', '--no-color'],
    { stdio: ['ignore', 'pipe', 'pipe'], cwd: import.meta.dirname + '/..' }
);

let stdout = '';
let stderr = '';

vitest.stdout.on('data', (chunk) => {
    stdout += chunk;
});

vitest.stderr.on('data', (chunk) => {
    stderr += chunk;
});

vitest.on('close', (code) => {
    if (code === 0) {
        // Parse JSON reporter output
        try {
            const lines = stdout.trim().split('\n');
            // Find the JSON line (vitest writes config + JSON)
            let jsonStr = '';
            for (const line of lines) {
                if (line.startsWith('{')) {
                    jsonStr = line;
                    break;
                }
            }
            if (!jsonStr) {
                // Fallback: use stdout directly
                console.log('✅ All tests passed');
                process.exit(0);
            }
            const result = JSON.parse(jsonStr);
            const { numTotalTests } = result;
            const numFiles = (result.testResults || []).length;
            console.log(`✅ All ${numTotalTests} tests passed in ${numFiles} ${numFiles === 1 ? 'file' : 'files'}`);
        } catch {
            console.log('✅ All tests passed');
        }
        process.exit(0);
    }

    // Failure path: extract only failures
    try {
        const lines = stdout.trim().split('\n');
        let jsonStr = '';
        for (const line of lines) {
            if (line.startsWith('{')) {
                jsonStr = line;
                break;
            }
        }
        if (!jsonStr) {
            console.error(stderr || '❌ Tests failed');
            process.exit(1);
        }

        const result = JSON.parse(jsonStr);
        const failures = [];

        for (const file of result.testResults || []) {
            for (const test of file.assertionResults || []) {
                if (test.status === 'failed') {
                    failures.push({
                        file: file.name.replace(/^.*?\/src\//, 'src/'),
                        test: test.fullName || test.title,
                        message: (test.failureMessages || []).join('\n'),
                    });
                }
            }
        }

        const { numFailedTests, numTotalTests, numPassedTests } = result;
        console.log(`❌ ${numFailedTests} of ${numTotalTests} tests failed (${numPassedTests} passed)\n`);

        for (const f of failures) {
            console.log(`FAIL ${f.file} > ${f.test}`);
            // Extract only the first meaningful assertion line
            const msgLines = f.message.split('\n');
            const assertLine = msgLines.find(l => l.includes('AssertionError') || l.includes('expected') || l.includes('received'));
            if (assertLine) {
                console.log(`     ${assertLine.trim()}`);
            }
            console.log();
        }
    } catch {
        console.error(stderr || '❌ Tests failed');
    }

    process.exit(1);
});