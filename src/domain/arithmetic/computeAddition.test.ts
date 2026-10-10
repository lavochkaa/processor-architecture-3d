import { describe, expect, it } from 'vitest';
import { computeAddition } from './computeAddition';

describe('computeAddition', () => {
  it.each(Array.from({ length: 256 }, (_, n) => [Math.floor(n / 16), n % 16]))(
    'computes %i + %i as four full-adder columns and a five-bit result',
    (a, b) => {
      const result = computeAddition(a, b);
      expect(result.a).toBe(a);
      expect(result.b).toBe(b);
      expect(result.aBits).toBe(a.toString(2).padStart(4, '0'));
      expect(result.bBits).toBe(b.toString(2).padStart(4, '0'));
      expect(result.result).toBe(a + b);
      expect(result.resultBits).toBe((a + b).toString(2).padStart(5, '0'));
      expect(result.lowBits).toBe(((a + b) & 15).toString(2).padStart(4, '0'));
      expect(result.columns).toHaveLength(4);

      let carry = 0;
      for (let bit = 0; bit < 4; bit += 1) {
        const aBit = (a >> bit) & 1;
        const bBit = (b >> bit) & 1;
        const total = aBit + bBit + carry;
        expect(result.columns[bit]).toEqual({
          index: bit,
          aBit,
          bBit,
          carryIn: carry,
          sumBit: total % 2,
          carryOut: Math.floor(total / 2)
        });
        carry = Math.floor(total / 2);
      }
      expect(result.columns[0].carryIn).toBe(0);
      expect(result.finalCarry).toBe(carry);
      expect(Number(result.resultBits[0])).toBe(carry);
    }
  );

  it.each([-1, 16, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid operand %s',
    (invalid) => {
      expect(() => computeAddition(invalid, 0)).toThrow(RangeError);
      expect(() => computeAddition(0, invalid)).toThrow(RangeError);
    }
  );

  it('keeps the arithmetic result and its columns immutable', () => {
    const result = computeAddition(11, 6);
    expect(result.resultBits).toBe('10001');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.columns)).toBe(true);
    expect(result.columns.every(Object.isFrozen)).toBe(true);
  });
});
