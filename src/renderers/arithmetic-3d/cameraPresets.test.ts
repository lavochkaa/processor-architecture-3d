import { describe, expect, it } from 'vitest';
import { cameraPoseFor, inputCameraPose } from './cameraPresets';

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
    expect(compact.target[1]).toBeGreaterThanOrEqual(0);
    expect(cameraPoseFor('alu-closeup', true, true)).toEqual(cameraPoseFor('board', true));
    const compactBoard = cameraPoseFor('board', true);
    expect(Math.abs(compactBoard.target[0])).toBeLessThan(1);
    expect(compactBoard.position[1]).toBeCloseTo(14.2);
    const narrowBoard = cameraPoseFor('board', true, false, true);
    expect(narrowBoard.position[1]).toBeGreaterThan(compactBoard.position[1]);
  });

  it('puts the input camera near the interactive keypad', () => {
    const input = inputCameraPose();
    expect(input.target[0]).toBeLessThan(-3);
    expect(input.position[2]).toBeLessThan(cameraPoseFor('board', true).position[2]);
    expect(inputCameraPose(true).position[2]).toBeGreaterThan(input.position[2]);
  });
});
