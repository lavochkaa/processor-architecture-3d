import { describe, expect, it } from 'vitest';
import { adderPosition, CPU_FOOTPRINT, SCENE_NODES } from './sceneLayout';

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

  it('puts registers, ALU and result inside one CPU package, with separate RAM and SSD', () => {
    for (const name of ['registerA', 'registerB', 'alu', 'result'] as const) {
      const [x, , z] = SCENE_NODES[name];
      expect(x).toBeGreaterThan(CPU_FOOTPRINT.minX);
      expect(x).toBeLessThan(CPU_FOOTPRINT.maxX);
      expect(z).toBeGreaterThan(CPU_FOOTPRINT.minZ);
      expect(z).toBeLessThan(CPU_FOOTPRINT.maxZ);
    }
    expect(SCENE_NODES.buffer[0]).toBeLessThan(CPU_FOOTPRINT.minX);
    expect(SCENE_NODES.ssd[2]).toBeGreaterThan(CPU_FOOTPRINT.maxZ);
  });
});
