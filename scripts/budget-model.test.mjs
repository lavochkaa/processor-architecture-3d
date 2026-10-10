import { describe, expect, it } from 'vitest';
import { analyzeRoute, extractEntries, parseImports } from './budget-model.mjs';

describe('bundle budget model', () => {
  it('reads Astro island entrypoints from route HTML', () => {
    const html = '<astro-island component-url="/_astro/ComputeApp.abc.js" renderer-url="/_astro/client.def.js"></astro-island>';
    expect(extractEntries(html)).toEqual(['ComputeApp.abc.js', 'client.def.js']);
  });

  it('separates static from dynamic imports in generated modules', () => {
    const source = 'import{a}from"./shared.js";import"./side.js";const x=()=>import(`./scene.js`);';
    expect(parseImports(source)).toEqual({
      static: ['shared.js', 'side.js'],
      dynamic: ['scene.js']
    });
  });

  it('counts shared chunks once and puts lazy 3D dependencies after the initial route', () => {
    const chunks = new Map([
      ['app.js', 'import{a}from"./shared.js";const x=()=>import(`./scene.js`);'],
      ['client.js', 'import{a}from"./shared.js";'],
      ['shared.js', 'export const a=1;'],
      ['scene.js', 'import{b}from"./three.js";const x=()=>import("./extra.js");'],
      ['three.js', 'export const b=1;'],
      ['extra.js', 'export const c=1;']
    ]);
    const compressed = new Map([
      ['app.js', 10], ['client.js', 20], ['shared.js', 30],
      ['scene.js', 40], ['three.js', 50], ['extra.js', 60]
    ]);
    const html = '<astro-island component-url="/_astro/app.js" renderer-url="/_astro/client.js"></astro-island>';
    expect(analyzeRoute(html, chunks, compressed)).toEqual({
      initialFiles: ['app.js', 'client.js', 'shared.js'],
      deferredFiles: ['extra.js', 'scene.js', 'three.js'],
      initialBytes: 60,
      deferredBytes: 150
    });
  });

  it('does not count a dynamically referenced initial chunk twice', () => {
    const chunks = new Map([
      ['app.js', 'import{a}from"./shared.js";const x=()=>import("./shared.js");'],
      ['shared.js', 'export const a=1;']
    ]);
    const compressed = new Map([['app.js', 10], ['shared.js', 20]]);
    expect(analyzeRoute('<script src="/_astro/app.js"></script>', chunks, compressed)).toMatchObject({
      initialBytes: 30,
      deferredBytes: 0
    });
  });

  it('fails loudly when a generated import is missing from the build', () => {
    expect(() => analyzeRoute('<script src="/_astro/app.js"></script>', new Map([
      ['app.js', 'import"./missing.js";']
    ]), new Map([['app.js', 1]]))).toThrow(/missing\.js/);
  });
});
