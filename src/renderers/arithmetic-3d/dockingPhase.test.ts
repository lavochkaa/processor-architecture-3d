import { describe, expect, it } from 'vitest';
import { advanceDockingClock, dockingFrame } from './dockingPhase';

describe('packet docking phase', () => {
  it('travels first, then overlaps the packet with its destination cell', () => {
    expect(dockingFrame(0)).toMatchObject({ routePhase: 0, packetOpacity: 1, destinationOpacity: 0 });
    expect(dockingFrame(.6)).toMatchObject({ packetOpacity: 1, destinationOpacity: 0 });
    const joining = dockingFrame(.9);
    expect(joining.routePhase).toBe(1);
    expect(joining.packetOpacity).toBeGreaterThan(0);
    expect(joining.destinationOpacity).toBeGreaterThan(0);
    expect(joining.packetOpacity + joining.destinationOpacity).toBeCloseTo(1);
    expect(dockingFrame(1)).toMatchObject({ routePhase: 1, packetOpacity: 0, destinationOpacity: 1 });
  });

  it('never leaves a blank frame at the receiver and reverses the same sequence', () => {
    for (let step = 0; step <= 100; step += 1) {
      const phase = step / 100;
      const forward = dockingFrame(phase);
      const backward = dockingFrame(1 - phase, true);
      expect(Math.max(forward.packetOpacity, forward.destinationOpacity)).toBeGreaterThanOrEqual(.5);
      expect(backward.routePhase).toBeCloseTo(forward.routePhase);
      expect(backward.packetOpacity).toBeCloseTo(forward.packetOpacity);
      expect(backward.destinationOpacity).toBeCloseTo(forward.destinationOpacity);
    }
  });

  it('clamps out-of-range progress so a late frame stays docked', () => {
    expect(dockingFrame(-1)).toEqual(dockingFrame(0));
    expect(dockingFrame(2)).toEqual(dockingFrame(1));
  });

  it('changes playback speed without restarting the current transfer', () => {
    const halfway = advanceDockingClock(0, .56, 1);
    expect(halfway).toBeCloseTo(.56);
    expect(advanceDockingClock(halfway, .14, 2)).toBeCloseTo(.84);
  });
});
