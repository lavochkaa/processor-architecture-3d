export type Bit = 0 | 1;

export interface FullAdderColumn {
  readonly index: number;
  readonly aBit: Bit;
  readonly bBit: Bit;
  readonly carryIn: Bit;
  readonly sumBit: Bit;
  readonly carryOut: Bit;
}

export interface AdditionResult {
  readonly a: number;
  readonly b: number;
  readonly aBits: string;
  readonly bBits: string;
  readonly columns: readonly FullAdderColumn[];
  readonly lowBits: string;
  readonly finalCarry: Bit;
  readonly resultBits: string;
  readonly result: number;
}

function assertOperand(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 15) {
    throw new RangeError('Operand must be an integer from 0 to 15');
  }
}

function asBit(value: number): Bit {
  return value as Bit;
}

export function computeAddition(a: number, b: number): AdditionResult {
  assertOperand(a);
  assertOperand(b);

  let carry: Bit = 0;
  const columns: FullAdderColumn[] = [];

  for (let index = 0; index < 4; index += 1) {
    const aBit = asBit((a >> index) & 1);
    const bBit = asBit((b >> index) & 1);
    const total = aBit + bBit + carry;
    const column: FullAdderColumn = Object.freeze({
      index,
      aBit,
      bBit,
      carryIn: carry,
      sumBit: asBit(total & 1),
      carryOut: asBit(total >> 1)
    });
    columns.push(column);
    carry = column.carryOut;
  }

  const result = a + b;
  return Object.freeze({
    a,
    b,
    aBits: a.toString(2).padStart(4, '0'),
    bBits: b.toString(2).padStart(4, '0'),
    columns: Object.freeze(columns),
    lowBits: (result & 15).toString(2).padStart(4, '0'),
    finalCarry: carry,
    resultBits: result.toString(2).padStart(5, '0'),
    result
  });
}
