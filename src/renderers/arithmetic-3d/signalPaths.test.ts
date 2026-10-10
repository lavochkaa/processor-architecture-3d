import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { resolveSignalPath } from './signalPaths';

describe('3D signal paths', () => {
  it('resolves every trace signal to finite scene coordinates', () => {
    for (const state of buildTrace(computeAddition(11, 6))) {
      for (const signal of state.signals) {
        const [from, to] = resolveSignalPath(signal);
        expect([...from, ...to].every(Number.isFinite)).toBe(true);
        expect(from).not.toEqual(to);
      }
    }
  });

  it('moves carry from right to left between adjacent adders', () => {
    const trace = buildTrace(computeAddition(15, 15));
    for (const state of trace.slice(3, 6)) {
      const carry = state.signals.find((signal) => signal.shape === 'diamond');
      expect(carry).toBeDefined();
      const [from, to] = resolveSignalPath(carry!);
      expect(from[0]).toBeGreaterThan(to[0]);
    }
  });

  it('does not create a moving diamond for a zero carry', () => {
    const trace = buildTrace(computeAddition(11, 6));
    expect(trace[3].carryIn).toBe(0);
    expect(trace[3].signals.some((signal) => signal.shape === 'diamond')).toBe(false);
  });
});
