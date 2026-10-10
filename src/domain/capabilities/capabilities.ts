import type { RenderMode } from '../scenario-engine/scenario';

export function resolveRenderMode(requested: RenderMode, webglAvailable: boolean): RenderMode {
  return requested === '3d' && !webglAvailable ? '2d' : requested;
}

export function canCreateWebGLContext(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return context !== null;
  } catch {
    return false;
  }
}
