import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import { adderPosition, SCENE_NODES, type Point3 } from './sceneLayout';

function pointFor(name: string, signal: TraceSignal, destination: boolean): Point3 {
  const lane = name.endsWith('-a') ? -.25 : name.endsWith('-b') ? .25 : 0;
  if (name.startsWith('keyboard-')) return [SCENE_NODES.keyboard[0], .47, lane];
  if (name.startsWith('ram-')) return [SCENE_NODES.buffer[0], .49, name === 'ram-result' ? .39 : lane];
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

/** The return bus follows the visible rear lane instead of cutting through the CPU package. */
export function routeForSignal(signal: TraceSignal): readonly Point3[] {
  const [from, to] = resolveSignalPath(signal);
  if ((signal.from === 'result-register' && signal.to === 'ram-result')
    || (signal.from === 'ram-result' && signal.to === 'screen')) {
    const rearZ = -2.25;
    return [from, [from[0], .48, rearZ], [to[0], .48, rearZ], to];
  }
  return [from, to];
}

export function pointOnRoute(route: readonly Point3[], phase: number): Point3 {
  if (route.length < 2) throw new RangeError('A route needs at least two points');
  if (phase <= 0) return route[0];
  if (phase >= 1) return route[route.length - 1];
  const lengths = route.slice(1).map((point, index) => Math.hypot(
    point[0] - route[index][0], point[1] - route[index][1], point[2] - route[index][2]
  ));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let distance = Math.max(0, Math.min(1, phase)) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const from = route[index];
      const to = route[index + 1];
      const fraction = lengths[index] === 0 ? 0 : Math.max(0, Math.min(1, distance / lengths[index]));
      return [
        from[0] + (to[0] - from[0]) * fraction,
        from[1] + (to[1] - from[1]) * fraction,
        from[2] + (to[2] - from[2]) * fraction
      ];
    }
    distance -= lengths[index];
  }
  return route[route.length - 1];
}
