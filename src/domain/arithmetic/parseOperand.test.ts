import { describe, expect, it } from 'vitest';
import { parseOperand } from './parseOperand';

describe('parseOperand', () => {
  it.each([
    ['0', 0], ['15', 15], ['01', 1], [' 11 ', 11], ['\t6\n', 6]
  ])('accepts %j as %i', (input, expected) => {
    expect(parseOperand(input)).toBe(expected);
  });

  it.each(['', ' ', '16', '-1', '1.5', '1 1', '001', 'foo', '１', 'Infinity'])('rejects %j', (input) => {
    expect(parseOperand(input)).toBeNull();
  });
});
