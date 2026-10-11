import { describe, expect, it } from 'vitest';
import { lidOpenForStep } from './lidState';

describe('CPU lid state', () => {
  it('opens to expose registers and ALU, then closes after the memory write', () => {
    expect([null, 1, 2, 3, 4, 7, 8, 9, 10].map(lidOpenForStep)).toEqual([0, 0, 0, .52, 1, 1, 1, .52, 0]);
  });
});
