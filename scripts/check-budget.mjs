import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import process from 'node:process';
import { analyzeRoute } from './budget-model.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const assetDirectory = join(dist, '_astro');
const files = readdirSync(assetDirectory);
const compressed = new Map();
const chunks = new Map();
for (const name of files) {
  if (!name.endsWith('.js') && !name.endsWith('.css')) continue;
  const data = readFileSync(join(assetDirectory, name));
  compressed.set(name, gzipSync(data).byteLength);
  if (name.endsWith('.js')) chunks.set(name, data.toString('utf8'));
}

const limits = { initial: 100 * 1024, deferred: 275 * 1024, css: 10 * 1024 };
const cssBytes = [...compressed].filter(([name]) => name.endsWith('.css'))
  .reduce((total, [, size]) => total + size, 0);
const routeNames = ['scenario', 'compute'];
const routes = new Map(routeNames.map((route) => [
  route,
  analyzeRoute(readFileSync(join(dist, route, 'index.html'), 'utf8'), chunks, compressed)
]));

for (const [name, route] of routes) {
  process.stdout.write(`/${name}/: начальный JS ${(route.initialBytes / 1024).toFixed(1)} KiB; отложенный JS ${(route.deferredBytes / 1024).toFixed(1)} KiB\n`);
  if (route.initialBytes > limits.initial || route.deferredBytes > limits.deferred) process.exitCode = 1;
}
process.stdout.write(`CSS: ${(cssBytes / 1024).toFixed(1)} KiB\n`);
if (cssBytes > limits.css) process.exitCode = 1;

const scenarioFiles = new Set([...routes.get('scenario').initialFiles, ...routes.get('scenario').deferredFiles]);
const computeFiles = new Set([...routes.get('compute').initialFiles, ...routes.get('compute').deferredFiles]);
const added = [...computeFiles].filter((name) => !scenarioFiles.has(name));
const addedBytes = added.reduce((total, name) => total + compressed.get(name), 0);
process.stdout.write(`Прирост /compute/ к /scenario/: ${(addedBytes / 1024).toFixed(1)} KiB gzip (${added.join(', ') || 'нет новых чанков'})\n`);
