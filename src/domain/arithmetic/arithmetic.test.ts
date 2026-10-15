import { describe, expect, it } from 'vitest';
import { arithmeticPresets, buildArithmeticTrace, fourBits } from './arithmetic';

describe('arithmetic trace', () => {
  it('formats values as four bits', () => {
    expect(fourBits(3)).toBe('0011');
    expect(fourBits(18)).toBe('0010');
  });

  it.each(arithmeticPresets)('finishes $label with correct binary result', (preset) => {
    const trace = buildArithmeticTrace(preset);
    expect(trace[0].aBits).toBe(fourBits(preset.a));
    expect(trace.at(-1)?.resultBits).toBe(fourBits(preset.result));
    expect(trace.filter((frame) => frame.stage === 'calculate')).toHaveLength(4);
  });

  it('shows a carry propagating in 3 + 2', () => {
    const trace = buildArithmeticTrace(arithmeticPresets[0]);
    expect(trace.find((frame) => frame.id === 'bit-1')).toMatchObject({ carryOut: 1, resultBits: '··01' });
    expect(trace.find((frame) => frame.id === 'bit-2')).toMatchObject({ carryIn: 1, resultBits: '·101' });
  });

  it('uses four-bit two’s complement for 5 - 2', () => {
    const trace = buildArithmeticTrace(arithmeticPresets[1]);
    expect(trace[1].bBits).toBe('1110');
    expect(trace.at(-1)?.resultBits).toBe('0011');
  });

  it('uses shifted partial products for 3 × 2', () => {
    const trace = buildArithmeticTrace(arithmeticPresets[2]);
    expect(trace.find((frame) => frame.id === 'bit-0')?.resultBits).toBe('0000');
    expect(trace.find((frame) => frame.id === 'bit-1')?.resultBits).toBe('0110');
  });
});
