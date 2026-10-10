/** @returns {string[]} */
export function extractEntries(html) {
  return [...new Set([...html.matchAll(/\/_astro\/([^"'`<>\s]+\.js)/g)].map((match) => match[1]))].sort();
}

/** @returns {{ static: string[], dynamic: string[] }} */
export function parseImports(source) {
  const staticNames = new Set();
  const dynamicNames = new Set();
  for (const match of source.matchAll(/\bfrom\s*(["'`])\.\/([^"'`]+\.js)\1/g)) staticNames.add(match[2]);
  for (const match of source.matchAll(/\bimport\s*(["'`])\.\/([^"'`]+\.js)\1/g)) staticNames.add(match[2]);
  for (const match of source.matchAll(/\bimport\s*\(\s*(["'`])\.\/([^"'`]+\.js)\1\s*\)/g)) dynamicNames.add(match[2]);
  return { static: [...staticNames].sort(), dynamic: [...dynamicNames].sort() };
}

/**
 * Analyze the JavaScript a single route needs initially and after all lazy imports.
 * Shared chunks are counted once in each route; already-initial chunks are never deferred.
 * @param {string} html
 * @param {Map<string, string>} chunks
 * @param {Map<string, number>} compressed
 */
export function analyzeRoute(html, chunks, compressed) {
  const initial = new Set();
  const deferred = new Set();

  function visitStatic(name, target) {
    if (initial.has(name) || target.has(name)) return;
    const source = chunks.get(name);
    if (source === undefined) throw new Error(`Missing generated chunk: ${name}`);
    target.add(name);
    for (const dependency of parseImports(source).static) visitStatic(dependency, target);
  }

  for (const entry of extractEntries(html)) visitStatic(entry, initial);

  const pending = [...initial].flatMap((name) => parseImports(chunks.get(name)).dynamic);
  while (pending.length > 0) {
    const name = pending.shift();
    if (initial.has(name) || deferred.has(name)) continue;
    const before = new Set(deferred);
    visitStatic(name, deferred);
    for (const added of deferred) {
      if (!before.has(added)) pending.push(...parseImports(chunks.get(added)).dynamic);
    }
  }

  function bytesFor(names) {
    return [...names].reduce((total, name) => {
      const size = compressed.get(name);
      if (size === undefined) throw new Error(`Missing compressed size: ${name}`);
      return total + size;
    }, 0);
  }

  return {
    initialFiles: [...initial].sort(),
    deferredFiles: [...deferred].sort(),
    initialBytes: bytesFor(initial),
    deferredBytes: bytesFor(deferred)
  };
}
