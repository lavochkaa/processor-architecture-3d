import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { receiverDock } from './dockingSlots';

describe('visible receiver slots', () => {
  const trace = buildTrace(computeAddition(11, 6));

  it('places operand strips inside their persistent RAM and register cells', () => {
    expect(receiverDock(trace[1].signals[0])).toEqual({ kind: 'bits', point: [-3.45, .205, -.32], width: 1.1, value: '1011' });
    expect(receiverDock(trace[2].signals[1])).toEqual({ kind: 'bits', point: [-1.55, .205, 1.05], width: 1.1, value: '0110' });
  });

  it('turns the outgoing carry into the leftmost result bit', () => {
    const carry = trace[7].signals.find((signal) => signal.shape === 'diamond');
    expect(carry).toBeDefined();
    expect(receiverDock(carry!)).toEqual({ kind: 'bits', point: [3.75 - 2 * 1.47 / 5, .205, 0], width: 1.47 / 5, value: '1' });
  });

  it('lands the written answer in RAM before the screen shows decimal text', () => {
    expect(receiverDock(trace[8].signals[0])).toEqual({ kind: 'bits', point: [-3.45, .205, .39], width: 1.27, value: '10001' });
    expect(receiverDock(trace[9].signals[0])).toEqual({ kind: 'screen', point: [5.52, .45, .04], value: '17' });
  });
});
