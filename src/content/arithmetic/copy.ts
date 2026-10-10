import type { AdditionTraceState, ChapterKey } from '../../domain/arithmetic/buildTrace';
import type { Announcement } from '../../domain/arithmetic/controller';

export const RESULT_REGISTER_LABEL = 'Регистр результата (условный, 5 бит)';

export const CHAPTER_LABELS: Record<ChapterKey, string> = {
  input: 'Ввод',
  memory: 'Память и регистры',
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
    case 'memory.store-operands':
      return {
        title: 'Операнды записаны в RAM',
        explanation: `Пакеты A · ${state.aBits} и B · ${state.bBits} доходят до ячеек RAM. Это учебный путь данных, а не реальные дорожки платы.`
      };
    case 'memory.load-registers':
      return {
        title: 'CPU загружает регистры A и B',
        explanation: `Значения из RAM скопированы в регистры CPU: A = ${state.aBits}, B = ${state.bBits}. Кэши в модели опущены.`
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
    case 'result.store-memory':
      return {
        title: 'Результат записан в RAM',
        explanation: `Пятибитный ответ ${state.registers.resultBits} скопирован из регистра CPU в отдельную ячейку RAM. Это выбранный учебный путь, не обязательное действие каждого сложения.`
      };
    case 'result.display': {
      const bits = state.registers.resultBits;
      if (!bits || state.screenValue === null) throw new Error('Display caption requires a result');
      const terms = [16, 8, 4, 2, 1].filter((_, index) => bits[index] === '1');
      return {
        title: 'Ответ появляется на экране',
        explanation: `${bits}₂ = ${terms.join(' + ') || '0'} = ${state.screenValue}₁₀. Приложение читает сохранённое значение и показывает его на экране; это не прямая электрическая линия из RAM.`
      };
    }
  }
}

export function formatAnnouncement(announcement: Announcement | null, trace: readonly AdditionTraceState[] | null): string {
  if (!announcement || !trace) return '';
  if (announcement.kind === 'chapter') {
    return `Глава ${CHAPTER_LABELS[announcement.chapter]}. Шаг ${announcement.step} из 10.`;
  }
  if (announcement.kind === 'stop') return `Воспроизведение остановлено на шаге ${announcement.step}.`;
  const state = trace[announcement.step - 1];
  const copy = copyForStep(state);
  return `Шаг ${announcement.step} из 10. ${copy.title}. ${copy.explanation}`;
}
