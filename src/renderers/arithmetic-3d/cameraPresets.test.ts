import { describe, expect, it } from 'vitest';
import { cameraPoseFor } from './cameraPresets';

describe('addition camera presets', () => {
  it('moves from the board to ALU and then toward the result', () => {
    const board = cameraPoseFor('board', false);
    const alu = cameraPoseFor('alu-closeup', false);
    const result = cameraPoseFor('result', false);
    expect(alu.position[1]).toBeLessThan(board.position[1]);
    expect(alu.target[0]).toBeLessThan(1);
    expect(result.target[0]).toBeGreaterThan(alu.target[0]);
    expect(result.position[1]).toBeGreaterThan(alu.position[1]);
  });

  it('frames the ALU above the table on compact screens and offers the board override', () => {
    const compact = cameraPoseFor('alu-closeup', true);
    expect(compact.target[1]).toBeLessThan(0);
    expect(cameraPoseFor('alu-closeup', true, true)).toEqual(cameraPoseFor('board', true));
  });
});
