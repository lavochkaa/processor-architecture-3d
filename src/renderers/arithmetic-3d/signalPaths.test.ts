import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { pointOnRoute, resolveSignalPath, routeForSignal } from './signalPaths';

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

  it('routes the CPU writeback through a visible edge lane and reaches both endpoints', () => {
    const writeback = buildTrace(computeAddition(11, 6))[8].signals[0];
    const route = routeForSignal(writeback);
    const [from, to] = resolveSignalPath(writeback);
    expect(route[0]).toEqual(from);
    expect(route.at(-1)).toEqual(to);
    expect(route.length).toBeGreaterThan(2);
    expect(route.some((point) => point[2] < -2)).toBe(true);
    expect(pointOnRoute(route, 0)).toEqual(from);
    expect(pointOnRoute(route, 1)).toEqual(to);
  });

  it('interpolates distance continuously along every segment', () => {
    const route = [[0, 0, 0], [2, 0, 0], [2, 0, 2]] as const;
    expect(pointOnRoute(route, .25)).toEqual([1, 0, 0]);
    expect(pointOnRoute(route, .75)).toEqual([2, 0, 1]);
  });
});
