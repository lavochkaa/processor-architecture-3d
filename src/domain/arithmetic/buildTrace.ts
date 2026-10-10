import type { AdditionResult, Bit, FullAdderColumn } from './computeAddition';

export type ChapterKey = 'input' | 'memory' | 'alu' | 'result';
export type CameraKey = 'board' | 'alu-closeup' | 'result';
export type ActiveNode = 'input' | 'ram-operands' | 'registers' | 'adder' | 'result-register' | 'ram-result' | 'screen';
export type CaptionKey = 'input.convert' | 'memory.store-operands' | 'memory.load-registers' | 'alu.bit' | 'result.assemble' | 'result.store-memory' | 'result.display';

export interface TraceSignal {
  readonly shape: 'packet' | 'diamond';
  readonly from: string;
  readonly to: string;
  readonly bitIndex: number | null;
  readonly value: Bit | null;
  readonly label: 'A' | 'B' | 'Σ' | string | null;
  readonly bits: string | null;
}

export interface AdditionTableState {
  readonly aBits: string;
  readonly bBits: string;
  /** Indexed from least significant to most significant: c₀ through c₄. */
  readonly carry: readonly (Bit | null)[];
  /** Indexed from least significant to most significant: s₀ through s₃. */
  readonly sum: readonly (Bit | null)[];
  readonly resultBit: Bit | null;
}

export interface AdditionTraceState {
  readonly step: number;
  readonly chapter: ChapterKey;
  readonly cameraKey: CameraKey;
  readonly captionKey: CaptionKey;
  readonly activeNode: ActiveNode;
  readonly activeBit: number | null;
  readonly activeColumn: FullAdderColumn | null;
  readonly a: number;
  readonly b: number;
  readonly aBits: string;
  readonly bBits: string;
  readonly memory: Readonly<{ aBits: string | null; bBits: string | null; resultBits: string | null }>;
  readonly registers: Readonly<{ aBits: string | null; bBits: string | null; resultBits: string | null }>;
  readonly carryIn: Bit | null;
  readonly carryOut: Bit | null;
  readonly table: AdditionTableState;
  readonly signals: readonly TraceSignal[];
  readonly screenValue: number | null;
}

const CHAPTERS: readonly ChapterKey[] = [
  'input', 'input', 'memory', 'alu', 'alu', 'alu', 'alu', 'result', 'result', 'result'
];
const CAMERAS: readonly CameraKey[] = [
  'board', 'board', 'board', 'alu-closeup', 'alu-closeup', 'alu-closeup', 'alu-closeup', 'result', 'result', 'result'
];
const CAPTIONS: readonly CaptionKey[] = [
  'input.convert', 'memory.store-operands', 'memory.load-registers', 'alu.bit', 'alu.bit', 'alu.bit', 'alu.bit',
  'result.assemble', 'result.store-memory', 'result.display'
];
const NODES: readonly ActiveNode[] = [
  'input', 'ram-operands', 'registers', 'adder', 'adder', 'adder', 'adder', 'result-register', 'ram-result', 'screen'
];

function packet(from: string, to: string, label: 'A' | 'B' | 'Σ', bits: string, bitIndex: number | null = null): TraceSignal {
  return Object.freeze({ shape: 'packet' as const, from, to, bitIndex, value: null, label, bits });
}

function diamond(from: string, to: string, bitIndex: number): TraceSignal {
  return Object.freeze({ shape: 'diamond' as const, from, to, value: 1 as const, bitIndex, label: `c${bitIndex + 1}`, bits: null });
}

function signalsForStep(result: AdditionResult, step: number): readonly TraceSignal[] {
  if (step === 2) {
    return Object.freeze([
      packet('keyboard-a', 'ram-a', 'A', result.aBits),
      packet('keyboard-b', 'ram-b', 'B', result.bBits)
    ]);
  }
  if (step === 3) {
    return Object.freeze([
      packet('ram-a', 'register-a', 'A', result.aBits),
      packet('ram-b', 'register-b', 'B', result.bBits)
    ]);
  }
  if (step >= 4 && step <= 7) {
    const bit = step - 4;
    const column = result.columns[bit];
    const signals = [
      packet('register-a', `adder-${bit}`, 'A', String(column.aBit), bit),
      packet('register-b', `adder-${bit}`, 'B', String(column.bBit), bit)
    ];
    if (column.carryOut === 1) {
      signals.push(diamond(`adder-${bit}`, bit === 3 ? 'carry-out' : `adder-${bit + 1}`, bit));
    }
    return Object.freeze(signals);
  }
  if (step === 8) {
    const signals: TraceSignal[] = result.columns.map((column) =>
      packet(`adder-${column.index}`, 'result-register', 'Σ', String(column.sumBit), column.index)
    );
    if (result.finalCarry === 1) signals.push(diamond('carry-out', 'result-register', 4));
    return Object.freeze(signals);
  }
  if (step === 9) return Object.freeze([packet('result-register', 'ram-result', 'Σ', result.resultBits)]);
  if (step === 10) return Object.freeze([packet('ram-result', 'screen', 'Σ', result.resultBits)]);
  return Object.freeze([]);
}

function tableForStep(result: AdditionResult, step: number): AdditionTableState {
  const revealed = Math.max(0, Math.min(4, step - 3));
  const carry: (Bit | null)[] = [null, null, null, null, null];
  const sum: (Bit | null)[] = [null, null, null, null];

  if (revealed > 0) carry[0] = 0;
  for (let bit = 0; bit < revealed; bit += 1) {
    sum[bit] = result.columns[bit].sumBit;
    carry[bit + 1] = result.columns[bit].carryOut;
  }

  return Object.freeze({
    aBits: result.aBits,
    bBits: result.bBits,
    carry: Object.freeze(carry),
    sum: Object.freeze(sum),
    resultBit: step >= 8 ? result.finalCarry : null
  });
}

/** A deterministic, immutable ten-state view of one arithmetic result. */
export function buildTrace(result: AdditionResult): readonly AdditionTraceState[] {
  const states = Array.from({ length: 10 }, (_, index): AdditionTraceState => {
    const step = index + 1;
    const activeBit = step >= 4 && step <= 7 ? step - 4 : null;
    const activeColumn = activeBit === null ? null : result.columns[activeBit];

    return Object.freeze({
      step,
      chapter: CHAPTERS[index],
      cameraKey: CAMERAS[index],
      captionKey: CAPTIONS[index],
      activeNode: NODES[index],
      activeBit,
      activeColumn,
      a: result.a,
      b: result.b,
      aBits: result.aBits,
      bBits: result.bBits,
      memory: Object.freeze({
        aBits: step >= 2 ? result.aBits : null,
        bBits: step >= 2 ? result.bBits : null,
        resultBits: step >= 9 ? result.resultBits : null
      }),
      registers: Object.freeze({
        aBits: step >= 3 ? result.aBits : null,
        bBits: step >= 3 ? result.bBits : null,
        resultBits: step >= 8 ? result.resultBits : null
      }),
      carryIn: activeColumn?.carryIn ?? null,
      carryOut: activeColumn?.carryOut ?? null,
      table: tableForStep(result, step),
      signals: signalsForStep(result, step),
      screenValue: step === 10 ? result.result : null
    });
  });
  return Object.freeze(states);
}
