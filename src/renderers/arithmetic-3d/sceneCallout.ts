import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import { adderPosition, SCENE_NODES, type Point3 } from './sceneLayout';

export interface ActionCallout {
  readonly title: string;
  readonly detail: string;
}

const subscript = (value: number) => String(value).replace(/[0-9]/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]);

export function anchorForState(state: AdditionTraceState | null): Point3 {
  if (!state || state.activeNode === 'input') return [SCENE_NODES.keyboard[0], 1.08, SCENE_NODES.keyboard[2]];
  if (state.activeNode === 'ram-operands' || state.activeNode === 'ram-result') return [SCENE_NODES.buffer[0], 1.03, SCENE_NODES.buffer[2]];
  if (state.activeNode === 'registers') return [SCENE_NODES.registerA[0], 1.05, 0];
  if (state.activeNode === 'adder' && state.activeBit !== null) {
    const [x, , z] = adderPosition(state.activeBit);
    return [x, 1.08, z];
  }
  if (state.activeNode === 'result-register') return [SCENE_NODES.result[0], 1.05, SCENE_NODES.result[2]];
  return [SCENE_NODES.screen[0], 1.65, SCENE_NODES.screen[2]];
}

export function actionCalloutFor(state: AdditionTraceState | null, inTransit = false): ActionCallout {
  if (!state) return { title: 'Клавиатура', detail: 'Выберите A или B и введите число 0–15' };
  if (state.step === 1) return { title: 'Ввод', detail: `A · ${state.aBits}   B · ${state.bBits}` };
  if (state.step === 2) return { title: 'RAM', detail: inTransit ? `A · ${state.aBits} и B · ${state.bBits} в пути` : `A · ${state.aBits}   B · ${state.bBits}` };
  if (state.step === 3) return { title: 'CPU · регистры', detail: inTransit ? 'Операнды A и B приходят из RAM' : `A · ${state.aBits}   B · ${state.bBits}` };
  if (state.activeColumn) {
    const bit = state.activeColumn.index;
    return {
      title: `ALU · сумматор ${bit}`,
      detail: inTransit
        ? `Биты a${subscript(bit)} и b${subscript(bit)} приходят; перенос c${subscript(bit)}=${state.activeColumn.carryIn}`
        : `a${subscript(bit)}=${state.activeColumn.aBit} + b${subscript(bit)}=${state.activeColumn.bBit} + c${subscript(bit)} = ${state.activeColumn.carryIn} → s${subscript(bit)}=${state.activeColumn.sumBit}, c${subscript(bit + 1)}=${state.activeColumn.carryOut}`
    };
  }
  if (state.step === 8) return { title: 'CPU · регистр результата', detail: inTransit ? 'Биты суммы собираются в пятибитный ответ' : `${state.registers.resultBits}₂ собрано` };
  if (state.step === 9) return { title: 'RAM · результат', detail: inTransit ? `${state.registers.resultBits}₂ направляется в RAM` : `${state.memory.resultBits}₂ записано` };
  return { title: 'Экран', detail: inTransit ? `${state.memory.resultBits}₂ направляется на экран` : `${state.memory.resultBits}₂ = ${state.screenValue}₁₀` };
}
