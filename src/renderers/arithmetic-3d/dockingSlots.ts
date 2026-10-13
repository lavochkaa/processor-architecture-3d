import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import type { Point3 } from './sceneLayout';
import { resolveSignalPath } from './signalPaths';

export type ReceiverDock =
  | Readonly<{ kind: 'bits'; point: Point3; width: number; value: string }>
  | Readonly<{ kind: 'carry'; point: Point3; value: '1' }>
  | Readonly<{ kind: 'screen'; point: Point3; value: string }>;

/** The transient landing glyph matches the permanent cell at the destination. */
export function receiverDock(signal: TraceSignal): ReceiverDock {
  const point = resolveSignalPath(signal)[1];
  if (signal.to === 'screen') {
    if (!signal.bits) throw new RangeError('Screen packet needs result bits');
    return { kind: 'screen', point, value: String(Number.parseInt(signal.bits, 2)) };
  }
  if (signal.shape === 'diamond' && signal.to !== 'result-register') {
    return { kind: 'carry', point, value: '1' };
  }
  const value = signal.shape === 'diamond' ? '1' : signal.bits;
  if (!value) throw new RangeError('Bit receiver needs a value');
  const width = signal.to.startsWith('adder-') ? .23
    : signal.to === 'result-register' ? 1.47 / 5
      : signal.to === 'ram-result' ? 1.27
        : 1.1;
  return { kind: 'bits', point, width, value };
}
