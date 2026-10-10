import { CHAPTER_LABELS, RESULT_REGISTER_LABEL, copyForStep } from '../../content/arithmetic/copy';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';

function RegisterDetails({ state }: { state: AdditionTraceState }) {
  return <div className="compute-register-grid">
    <span><small>ОПЕРАНДЫ</small><strong>{state.a} + {state.b}</strong><code>{state.aBits} + {state.bBits}</code></span>
    <span><small>БУФЕР</small><code>{state.buffer ? `${state.buffer.aBits} / ${state.buffer.bBits}` : '—'}</code></span>
    <span><small>РЕГИСТР A / B</small><code>{state.registers.aBits ?? '—'} / {state.registers.bBits ?? '—'}</code></span>
    <span><small>{RESULT_REGISTER_LABEL.toUpperCase()}</small><code>{state.registers.resultBits ?? '—'}</code></span>
  </div>;
}

export function AdditionPanel({ state, onEdit, onOverview }: { state: AdditionTraceState; onEdit: () => void; onOverview: () => void }) {
  const copy = copyForStep(state);
  return <header className="compute-panel">
    <div className="compute-panel-top">
      <span className="compute-eyebrow">ЛОГИЧЕСКАЯ МОДЕЛЬ / {CHAPTER_LABELS[state.chapter]}</span>
      <span className="compute-step-counter">Шаг {state.step} из 9</span>
      <button type="button" className="compute-text-button" onClick={onEdit}>Изменить числа</button>
    </div>
    <div className="compute-panel-main">
      <div>
        <nav className="compute-breadcrumb" aria-label="Масштаб сцены">
          <button type="button" onClick={onOverview}>Плата</button>
          {state.cameraKey === 'alu-closeup' && <><span aria-hidden="true">→</span><span>ALU</span></>}
          {state.cameraKey === 'result' && <><span aria-hidden="true">→</span><span>Результат</span></>}
        </nav>
        <h2>{copy.title}</h2>
        <p>{copy.explanation}</p>
      </div>
      <div className="compute-operation"><small>ТЕКУЩАЯ ОПЕРАЦИЯ</small><strong>{state.a} + {state.b}{state.screenValue === null ? ' = ?' : ` = ${state.screenValue}`}</strong></div>
    </div>
    <div className="compute-registers-desktop"><RegisterDetails state={state} /></div>
    <details className="compute-registers-mobile"><summary>Операнды и регистры</summary><RegisterDetails state={state} /></details>
  </header>;
}
