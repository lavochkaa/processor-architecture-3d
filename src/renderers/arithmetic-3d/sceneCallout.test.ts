import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { actionCalloutFor, anchorForState } from './sceneCallout';
import { adderPosition, SCENE_NODES } from './sceneLayout';

describe('scene action callout', () => {
  const trace = buildTrace(computeAddition(11, 6));

  it('anchors each explanation above the active hardware', () => {
    expect(anchorForState(null)[0]).toBe(SCENE_NODES.keyboard[0]);
    expect(anchorForState(trace[1])[0]).toBe(SCENE_NODES.buffer[0]);
    expect(anchorForState(trace[3])[0]).toBe(adderPosition(0)[0]);
    expect(anchorForState(trace[9])[0]).toBe(SCENE_NODES.screen[0]);
  });

  it('names the active component and its actual values', () => {
    expect(actionCalloutFor(trace[1])).toEqual({ title: 'RAM', detail: 'A · 1011   B · 0110' });
    expect(actionCalloutFor(trace[3]).detail).toContain('c₀ = 0');
    expect(actionCalloutFor(trace[8])).toEqual({ title: 'RAM · результат', detail: '10001₂ записано' });
    expect(actionCalloutFor(trace[9])).toEqual({ title: 'Экран', detail: '10001₂ = 17₁₀' });
  });

  it('uses in-progress wording until the packet reaches the destination', () => {
    expect(actionCalloutFor(trace[1], true).detail).toContain('в пути');
    expect(actionCalloutFor(trace[3], true).detail).toContain('приходят');
    expect(actionCalloutFor(trace[8], true).detail).toContain('направляется');
  });
});
