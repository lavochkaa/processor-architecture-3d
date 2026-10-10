import type { AdditionTraceState, ChapterKey } from '../../domain/arithmetic/buildTrace';
import type { Announcement } from '../../domain/arithmetic/controller';

export const RESULT_REGISTER_LABEL = 'Регистр результата (условный, 5 бит)';

export const CHAPTER_LABELS: Record<ChapterKey, string> = {
  input: 'Ввод',
  registers: 'Регистры',
  alu: 'ALU',
  result: 'Результат'
};

export interface StepCopy {
  title: string;
  explanation: string;
}

export function copyForStep(state: AdditionTraceState): StepCopy {
  switch (state.captionKey) {
    case 'input.convert':
      return {
        title: 'Два числа становятся битами',
        explanation: `${state.a} → ${state.aBits}; ${state.b} → ${state.bBits}. В учебной модели это два четырёхбитных операнда.`
      };
    case 'registers.buffer':
      return {
        title: 'Операнды входят в условный буфер',
        explanation: 'Круглые импульсы показывают передачу двух значений. Это логическая модель, а не физические дорожки платы.'
      };
    case 'registers.load':
      return {
        title: 'Регистры A и B загружены',
        explanation: `Регистр A хранит ${state.aBits}, регистр B — ${state.bBits}. Теперь ALU может читать разряды справа налево.`
      };
    case 'alu.bit': {
      const column = state.activeColumn;
      if (!column) throw new Error('ALU caption requires an active column');
      return {
        title: `Сложение разряда ${column.index}`,
        explanation: `${column.aBit} + ${column.bBit} + входной перенос ${column.carryIn} = ${column.carryOut}${column.sumBit}₂. Бит суммы s${column.index} = ${column.sumBit}; перенос c${column.index + 1} = ${column.carryOut}.`
      };
    }
    case 'result.assemble':
      return {
        title: 'Пять бит собираются в регистре результата',
        explanation: `Перенос не потерян: c₄ = ${state.table.resultBit} стал старшим битом ${state.registers.resultBits}. Это полный беззнаковый ответ учебной модели, не правило ширины реального регистра CPU.`
      };
    case 'result.display': {
      const bits = state.registers.resultBits;
      if (!bits || state.screenValue === null) throw new Error('Display caption requires a result');
      const terms = [16, 8, 4, 2, 1].filter((_, index) => bits[index] === '1');
      return {
        title: 'Ответ появляется на экране',
        explanation: `${bits}₂ = ${terms.join(' + ') || '0'} = ${state.screenValue}₁₀. Десятичное число снова можно прочитать на экране.`
      };
    }
  }
}

export function formatAnnouncement(announcement: Announcement | null, trace: readonly AdditionTraceState[] | null): string {
  if (!announcement || !trace) return '';
  if (announcement.kind === 'chapter') {
    return `Глава ${CHAPTER_LABELS[announcement.chapter]}. Шаг ${announcement.step} из 9.`;
  }
  if (announcement.kind === 'stop') return `Воспроизведение остановлено на шаге ${announcement.step}.`;
  const state = trace[announcement.step - 1];
  const copy = copyForStep(state);
  return `Шаг ${announcement.step} из 9. ${copy.title}. ${copy.explanation}`;
}
