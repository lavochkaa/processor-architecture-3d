export type OperationId = 'add' | 'subtract' | 'multiply';

export interface ArithmeticPreset {
  id: OperationId;
  label: string;
  symbol: string;
  a: number;
  b: number;
  result: number;
}

export interface ArithmeticFrame {
  id: string;
  title: string;
  explanation: string;
  activeBit: number | null;
  aBits: string;
  bBits: string;
  resultBits: string;
  carryIn: number;
  carryOut: number;
  stage: 'load' | 'decode' | 'calculate' | 'result';
}

export const arithmeticPresets: ArithmeticPreset[] = [
  { id: 'add', label: 'Сложение', symbol: '+', a: 3, b: 2, result: 5 },
  { id: 'subtract', label: 'Вычитание', symbol: '−', a: 5, b: 2, result: 3 },
  { id: 'multiply', label: 'Умножение', symbol: '×', a: 3, b: 2, result: 6 }
];

export function fourBits(value: number): string {
  return (value & 0b1111).toString(2).padStart(4, '0');
}

export function buildArithmeticTrace(preset: ArithmeticPreset): ArithmeticFrame[] {
  const aBits = fourBits(preset.a);
  const bBits = fourBits(preset.b);
  const frames: ArithmeticFrame[] = [
    { id: 'load', title: 'Числа становятся битами', explanation: `${preset.a} = ${aBits}, ${preset.b} = ${bBits}. В учебной модели два четырёхбитных регистра хранят операнды.`, activeBit: null, aBits, bBits, resultBits: '····', carryIn: 0, carryOut: 0, stage: 'load' }
  ];

  if (preset.id === 'multiply') {
    frames.push({ id: 'decode', title: 'Выбираем умножение', explanation: 'Для наглядности используем сдвиг и сложение частичных произведений. Реальный процессор может реализовать умножение иначе.', activeBit: null, aBits, bBits, resultBits: '····', carryIn: 0, carryOut: 0, stage: 'decode' });
    let partial = 0;
    for (let bit = 0; bit < 4; bit += 1) {
      const enabled = (preset.b >> bit) & 1;
      if (enabled) partial += preset.a << bit;
      frames.push({ id: `bit-${bit}`, title: `Разряд множителя 2^${bit}`, explanation: enabled ? `Бит ${bit} равен 1: сдвигаем ${aBits} на ${bit} и прибавляем к сумме. Сейчас сумма ${fourBits(partial)}.` : `Бит ${bit} равен 0: частичное произведение равно нулю; сумма остаётся ${fourBits(partial)}.`, activeBit: bit, aBits, bBits, resultBits: fourBits(partial), carryIn: 0, carryOut: 0, stage: 'calculate' });
    }
  } else {
    const subtract = preset.id === 'subtract';
    const effectiveB = subtract ? ((~preset.b + 1) & 0b1111) : preset.b;
    const effectiveBits = fourBits(effectiveB);
    frames.push({ id: 'decode', title: subtract ? 'Вычитание через дополнение' : 'Выбираем сложение', explanation: subtract ? `В четырёх битах −${preset.b} представлено как ${effectiveBits}: инверсия битов и прибавление 1. Считаем ${aBits} + ${effectiveBits}.` : 'Сумматор складывает разряды справа налево. Каждый разряд может передать перенос следующему.', activeBit: null, aBits, bBits: effectiveBits, resultBits: '····', carryIn: 0, carryOut: 0, stage: 'decode' });
    let carry = 0;
    let partial = '';
    for (let bit = 0; bit < 4; bit += 1) {
      const a = (preset.a >> bit) & 1;
      const b = (effectiveB >> bit) & 1;
      const carryIn = carry;
      const sum = a + b + carryIn;
      carry = sum > 1 ? 1 : 0;
      partial = String(sum & 1) + partial;
      frames.push({ id: `bit-${bit}`, title: `Разряд 2^${bit}: ${a} + ${b} + ${carryIn}`, explanation: `${a} + ${b} + входящий перенос ${carryIn} = ${sum}. Записываем ${sum & 1}${carry ? `, переносим 1 в следующий разряд` : ', переноса нет'}.`, activeBit: bit, aBits, bBits: effectiveBits, resultBits: '·'.repeat(3 - bit) + partial, carryIn, carryOut: carry, stage: 'calculate' });
    }
  }

  frames.push({ id: 'result', title: `Результат: ${preset.result}`, explanation: preset.id === 'subtract' ? `В четырёх разрядах получаем ${fourBits(preset.result)} = ${preset.result}. Выходной перенос отбрасываем в этой модели арифметики по модулю 16.` : `${fourBits(preset.result)} в двоичной записи соответствует ${preset.result} в десятичной. Это значение можно передать дальше программе.`, activeBit: null, aBits, bBits: preset.id === 'subtract' ? fourBits((~preset.b + 1) & 0b1111) : bBits, resultBits: fourBits(preset.result), carryIn: 0, carryOut: 0, stage: 'result' });
  return frames;
}
