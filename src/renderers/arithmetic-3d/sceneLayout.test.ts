import { describe, expect, it } from 'vitest';
import { adderPosition, SCENE_NODES } from './sceneLayout';

describe('3D addition layout', () => {
  it('keeps the data route on one board from input to screen', () => {
    const nodes = [SCENE_NODES.keyboard, SCENE_NODES.buffer, SCENE_NODES.registerA,
      SCENE_NODES.alu, SCENE_NODES.result, SCENE_NODES.screen];
    for (let index = 1; index < nodes.length; index += 1) {
      expect(nodes[index][0]).toBeGreaterThan(nodes[index - 1][0]);
    }
    expect(SCENE_NODES.registerA[2]).toBeLessThan(SCENE_NODES.registerB[2]);
  });

  it('places carry blocks from right to left as bit index increases', () => {
    const positions = [0, 1, 2, 3].map(adderPosition);
    for (let bit = 1; bit < 4; bit += 1) expect(positions[bit][0]).toBeLessThan(positions[bit - 1][0]);
    expect(() => adderPosition(-1)).toThrow(RangeError);
    expect(() => adderPosition(4)).toThrow(RangeError);
  });
});
