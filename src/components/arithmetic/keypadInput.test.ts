import { describe, expect, it } from 'vitest';
import { applyKeypadInput } from './keypadInput';

describe('3D numeric keypad input', () => {
  const initial = { a: '11', b: '6', selected: 'a' as const };

  it('edits the selected operand and keeps the other unchanged', () => {
    expect(applyKeypadInput(initial, '⌫')).toEqual({ a: '1', b: '6', selected: 'a' });
    expect(applyKeypadInput({ a: '', b: '6', selected: 'a' }, '5')).toEqual({ a: '5', b: '6', selected: 'a' });
  });

  it('switches operands without changing values', () => {
    expect(applyKeypadInput(initial, 'A/B')).toEqual({ a: '11', b: '6', selected: 'b' });
    expect(applyKeypadInput({ a: '11', b: '6', selected: 'b' }, '0')).toEqual({ a: '11', b: '60', selected: 'b' });
  });
});
