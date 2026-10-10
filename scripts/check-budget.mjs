import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import process from 'node:process';

const directory = fileURLToPath(new URL('../dist/_astro/', import.meta.url));
const files = readdirSync(directory);
const compressed = (name) => gzipSync(readFileSync(join(directory, name))).byteLength;
const initialJs = files.filter((name) => name.endsWith('.js') && !name.startsWith('Scene3D.')).reduce((sum, name) => sum + compressed(name), 0);
const scene3D = files.filter((name) => name.startsWith('Scene3D.') && name.endsWith('.js')).reduce((sum, name) => sum + compressed(name), 0);
const css = files.filter((name) => name.endsWith('.css')).reduce((sum, name) => sum + compressed(name), 0);
const budgets = [
  ['Начальный JS', initialJs, 100_000],
  ['Отложенный 3D JS', scene3D, 275_000],
  ['CSS', css, 10_000]
];

for (const [label, actual, limit] of budgets) {
  process.stdout.write(`${label}: ${(actual / 1024).toFixed(1)} KiB gzip / ${(limit / 1024).toFixed(1)} KiB лимит\n`);
}

if (budgets.some(([, actual, limit]) => actual > limit)) process.exitCode = 1;
