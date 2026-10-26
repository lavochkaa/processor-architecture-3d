import { afterEach, describe, expect, it, vi } from 'vitest';
import { canCreateWebGLContext, resolveRenderMode } from './capabilities';

afterEach(() => vi.unstubAllGlobals());

describe('render mode fallback', () => {
  it('keeps 2D and text available regardless of WebGL', () => {
    expect(resolveRenderMode('2d', false)).toBe('2d');
    expect(resolveRenderMode('text', false)).toBe('text');
  });

  it('falls back from 3D to 2D when WebGL is unavailable', () => {
    expect(resolveRenderMode('3d', false)).toBe('2d');
    expect(resolveRenderMode('3d', true)).toBe('3d');
  });

  it('detects working and unavailable WebGL contexts', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: (kind: string) => kind === 'webgl2' ? {} : null }) });
    expect(canCreateWebGLContext()).toBe(true);
    vi.stubGlobal('document', { createElement: () => ({ getContext: (kind: string) => kind === 'webgl' ? {} : null }) });
    expect(canCreateWebGLContext()).toBe(false);
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    expect(canCreateWebGLContext()).toBe(false);
    vi.stubGlobal('document', { createElement: () => { throw new Error('blocked'); } });
    expect(canCreateWebGLContext()).toBe(false);
  });
});
