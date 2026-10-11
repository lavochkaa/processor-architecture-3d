import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { motionForTransition } from './motionState';

describe('scene motion selection', () => {
  const trace = buildTrace(computeAddition(11, 6));

  it('uses the destination transfer for forward travel', () => {
    expect(motionForTransition(trace[0], trace[1])).toEqual({ signals: trace[1].signals, reverse: false });
  });

  it('reverses the previous transfer when stepping back', () => {
    expect(motionForTransition(trace[8], trace[7])).toEqual({ signals: trace[8].signals, reverse: true });
  });

  it('does not invent a signal path for direct chapter jumps', () => {
    expect(motionForTransition(trace[0], trace[7])).toEqual({ signals: [], reverse: false });
  });
});
