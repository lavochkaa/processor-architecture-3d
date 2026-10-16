import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import type { Bit } from '../../domain/arithmetic/computeAddition';
import { RESULT_REGISTER_LABEL } from '../../content/arithmetic/copy';
import { BitCell } from './BitCell';

export function FlatRoute({ state }: { state: AdditionTraceState }) {
  const nodes = [
    { id: 'input', label: 'Ввод', value: `${state.aBits} / ${state.bBits}` },
    { id: 'ram-operands', label: 'RAM · операнды', value: `${state.memory.aBits ?? '—'} / ${state.memory.bBits ?? '—'}` },
    { id: 'registers', label: 'CPU · регистры A / B', value: `${state.registers.aBits ?? '—'} / ${state.registers.bBits ?? '—'}` },
    { id: 'adder', label: 'CPU · ALU · четыре полных сумматора', value: state.activeBit === null ? '—' : `Активен разряд ${state.activeBit}` },
    { id: 'result-register', label: RESULT_REGISTER_LABEL, value: state.registers.resultBits ?? '—' },
    { id: 'ram-result', label: 'RAM · результат', value: state.memory.resultBits ?? '—' },
    { id: 'screen', label: 'Экран', value: state.screenValue === null ? '—' : String(state.screenValue) }
  ];

  return <div className="compute-flat-route" data-testid="compute-flat" tabIndex={0} aria-label="Плоская схема вычисления">
    <div className="compute-plate-head"><span>ПЛАТА / УЧЕБНАЯ АБСТРАКЦИЯ</span><span>Один путь программы, не реальные дорожки платы</span></div>
    <ol className="compute-node-list" aria-label="Путь операндов">
      {nodes.map((node) => <li key={node.id} className={state.activeNode === node.id ? 'is-active' : ''} aria-current={state.activeNode === node.id ? 'step' : undefined}>
        <small>{node.label}</small><strong>{node.value}</strong>
      </li>)}
    </ol>
    <div className="compute-adders" aria-label="Четыре полных сумматора">
      {[3, 2, 1, 0].map((bit) => <div key={bit} className={`compute-adder${state.activeBit === bit ? ' is-active' : ''}`}>
        <small>РАЗРЯД {bit}</small>
        <div className="compute-adder-bits">
          <BitCell value={Number(state.aBits[3 - bit]) as Bit} label={`a${bit}`} />
          <span aria-hidden="true">+</span>
          <BitCell value={Number(state.bBits[3 - bit]) as Bit} label={`b${bit}`} />
          <span aria-hidden="true">+</span>
          <BitCell value={state.table.carry[bit]} label={`c${bit}`} />
        </div>
        <div className="compute-adder-out"><span>СУММА <BitCell value={state.table.sum[bit]} label={`s${bit}`} /></span><span>ПЕРЕНОС <span className="compute-diamond" aria-hidden="true">◆</span><BitCell value={state.table.carry[bit + 1]} label={`c${bit + 1}`} /></span></div>
      </div>)}
    </div>
    <div className="compute-signal-key"><span>▰ подписанная полоска = значение</span><span><span className="compute-diamond" aria-hidden="true">◆</span> перенос</span></div>
  </div>;
}
