import { describe, expect, it } from 'vitest';
import { buildTrace } from './buildTrace';
import { computeAddition } from './computeAddition';

describe('buildTrace', () => {
  it.each(Array.from({ length: 256 }, (_, n) => [Math.floor(n / 16), n % 16]))(
    'builds nine deterministic states for %i + %i',
    (a, b) => {
      const arithmetic = computeAddition(a, b);
      const trace = buildTrace(arithmetic);
      expect(trace).toHaveLength(9);
      expect(trace.map((state) => state.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(trace.map((state) => state.chapter)).toEqual([
        'input', 'registers', 'registers', 'alu', 'alu', 'alu', 'alu', 'result', 'result'
      ]);
      expect(trace.map((state) => state.cameraKey)).toEqual([
        'board', 'board', 'board', 'alu-closeup', 'alu-closeup', 'alu-closeup', 'alu-closeup', 'result', 'result'
      ]);
      expect(trace[0].buffer).toBeNull();
      expect(trace[1].buffer).toEqual({ aBits: arithmetic.aBits, bBits: arithmetic.bBits });
      expect(trace[2].registers.aBits).toBe(arithmetic.aBits);
      expect(trace[2].registers.bBits).toBe(arithmetic.bBits);

      for (let bit = 0; bit < 4; bit += 1) {
        const state = trace[bit + 3];
        const column = arithmetic.columns[bit];
        expect(state.activeBit).toBe(bit);
        expect(state.carryIn).toBe(column.carryIn);
        expect(state.carryOut).toBe(column.carryOut);
        expect(state.table.carry[0]).toBe(0);
        expect(state.table.carry[bit + 1]).toBe(column.carryOut);
        for (let prior = 0; prior < 4; prior += 1) {
          expect(state.table.sum[prior]).toBe(prior <= bit ? arithmetic.columns[prior].sumBit : null);
          if (prior < bit) expect(state.table.sum[prior]).toBe(trace[bit + 2].table.sum[prior]);
        }
        expect(state.signals.filter((signal) => signal.shape === 'circle')).toHaveLength(2);
        expect(state.signals.some((signal) => signal.shape === 'diamond')).toBe(column.carryOut === 1);
      }

      expect(trace[7].table.resultBit).toBe(arithmetic.finalCarry);
      expect(trace[7].registers.resultBits).toBe(arithmetic.resultBits);
      expect(trace[7].signals.some((signal) => signal.shape === 'diamond')).toBe(arithmetic.finalCarry === 1);
      expect(trace[7].screenValue).toBeNull();
      expect(trace[8].screenValue).toBe(a + b);
      expect(trace[8].registers.resultBits).toBe(arithmetic.resultBits);

      const repeated = buildTrace(arithmetic);
      for (const index of [8, 0, 6, 3, 8, 1, 4, 2, 7, 5]) {
        expect(trace[index]).toEqual(repeated[index]);
      }
      expect(trace.every(Object.isFrozen)).toBe(true);
    }
  );

  it('shows a zero input carry and five-bit 11 + 6 example', () => {
    const trace = buildTrace(computeAddition(11, 6));
    expect(trace[3].table.carry[0]).toBe(0);
    expect(trace[6].table.sum).toEqual([1, 0, 0, 0]);
    expect(trace[7].registers.resultBits).toBe('10001');
    expect(trace[8].screenValue).toBe(17);
  });
});
