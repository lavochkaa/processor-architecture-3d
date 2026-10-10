import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import { adderPosition, SCENE_NODES, type Point3 } from './sceneLayout';

function pointFor(name: string, signal: TraceSignal, destination: boolean): Point3 {
  const lane = name.endsWith('-a') ? -.25 : name.endsWith('-b') ? .25 : 0;
  if (name.startsWith('input-')) return [SCENE_NODES.keyboard[0], .47, lane];
  if (name.startsWith('buffer-')) return [SCENE_NODES.buffer[0], .49, lane];
  if (name === 'register-a') return [SCENE_NODES.registerA[0], .49, SCENE_NODES.registerA[2]];
  if (name === 'register-b') return [SCENE_NODES.registerB[0], .49, SCENE_NODES.registerB[2]];
  if (name.startsWith('adder-')) {
    const bit = Number(name.slice(6));
    const adder = adderPosition(bit);
    const offset = signal.shape === 'diamond' && !destination ? -.24 : 0;
    return [adder[0] + offset, .53, signal.from === 'register-a' ? -.25 : signal.from === 'register-b' ? .25 : 0];
  }
  if (name === 'carry-out') return [-.45, .53, 0];
  if (name === 'result-register') {
    const bit = signal.bitIndex;
    return [SCENE_NODES.result[0] + (bit === null ? 0 : (2 - bit) * .29), .48, 0];
  }
  if (name === 'screen') return [SCENE_NODES.screen[0], .8, 0];
  throw new RangeError(`Unknown signal endpoint: ${name}`);
}

export function resolveSignalPath(signal: TraceSignal): readonly [Point3, Point3] {
  return [pointFor(signal.from, signal, false), pointFor(signal.to, signal, true)];
}
