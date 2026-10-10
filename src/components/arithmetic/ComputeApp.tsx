import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { CHAPTER_LABELS, formatAnnouncement } from '../../content/arithmetic/copy';
import type { ChapterKey } from '../../domain/arithmetic/buildTrace';
import { createControllerState, currentTraceState, reduceController, type PlaybackSpeed } from '../../domain/arithmetic/controller';
import { OPERAND_ERROR, parseOperand } from '../../domain/arithmetic/parseOperand';
import { canCreateWebGLContext } from '../../domain/capabilities/capabilities';
import { AdditionPanel } from './AdditionPanel';
import { AdditionTable } from './AdditionTable';
import { FlatRoute } from './FlatRoute';

const CHAPTERS: readonly ChapterKey[] = ['input', 'registers', 'alu', 'result'];
const Arithmetic3D = lazy(() => import('../../renderers/arithmetic-3d/Arithmetic3D'));
const CHAPTER_RANGES: Record<ChapterKey, string> = {
  input: '1', registers: '2–3', alu: '4–7', result: '8–9'
};

export default function ComputeApp() {
  const [controller, dispatch] = useReducer(reduceController, undefined, createControllerState);
  const [aInput, setAInput] = useState('11');
  const [bInput, setBInput] = useState('6');
  const [touched, setTouched] = useState({ a: false, b: false });
  const [tableCollapsed, setTableCollapsed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [overviewOverride, setOverviewOverride] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [flatMode, setFlatMode] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const aRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);
  const state = currentTraceState(controller);
  const aError = touched.a && parseOperand(aInput) === null;
  const bError = touched.b && parseOperand(bInput) === null;
  const showing3D = state !== null && webgl === true && !flatMode;
  const handleContextLost = useCallback(() => { setWebgl(false); setFlatMode(true); }, []);

  useEffect(() => setWebgl(canCreateWebGLContext()), []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!controller.playing) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 1600 / controller.speed);
    return () => window.clearTimeout(timer);
  }, [controller.playing, controller.stepIndex, controller.speed]);

  useEffect(() => setOverviewOverride(false), [state?.cameraKey]);

  function updateInput(field: 'a' | 'b', value: string) {
    if (field === 'a') setAInput(value);
    else setBInput(value);
    if (parseOperand(value) !== null) setTouched((previous) => ({ ...previous, [field]: false }));
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const a = parseOperand(aInput);
    const b = parseOperand(bInput);
    if (a === null || b === null) {
      setTouched({ a: a === null, b: b === null });
      (a === null ? aRef : bRef).current?.focus();
      return;
    }
    setTableCollapsed(false);
    dispatch({ type: 'start', a, b });
  }

  function chapterKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!(event.target instanceof HTMLButtonElement)) return;
    event.preventDefault();
    const current = CHAPTERS.indexOf(event.target.dataset.chapter as ChapterKey);
    if (current < 0) return;
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    dispatch({ type: 'jump-chapter', chapter: CHAPTERS[next] });
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }

  return <section className="compute-app" aria-label="Симуляция сложения двух чисел">
    {!state ? <header className="compute-input-panel">
      <div className="compute-panel-top"><span className="compute-eyebrow">ЛОГИЧЕСКАЯ МОДЕЛЬ / ВВОД</span><span>ЧЕТЫРЕ БИТА НА ОПЕРАНД</span></div>
      <div className="compute-input-layout">
        <div><h2>Введите два числа</h2><p>Целые числа от 0 до 15. Модель покажет сложение справа налево и пятибитный ответ.</p></div>
        <form className="compute-form" onSubmit={submit} noValidate>
          <div className="compute-fields">
            <div className="compute-field"><label htmlFor="operand-a">Число A</label><input id="operand-a" ref={aRef} type="text" inputMode="numeric" autoComplete="off" value={aInput} aria-invalid={aError ? true : undefined} aria-describedby={aError ? 'operand-a-error' : undefined} onChange={(event) => updateInput('a', event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, a: true }))} />{aError && <small id="operand-a-error" className="compute-error">{OPERAND_ERROR}</small>}</div>
            <span className="compute-plus" aria-hidden="true">+</span>
            <div className="compute-field"><label htmlFor="operand-b">Число B</label><input id="operand-b" ref={bRef} type="text" inputMode="numeric" autoComplete="off" value={bInput} aria-invalid={bError ? true : undefined} aria-describedby={bError ? 'operand-b-error' : undefined} onChange={(event) => updateInput('b', event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, b: true }))} />{bError && <small id="operand-b-error" className="compute-error">{OPERAND_ERROR}</small>}</div>
          </div>
          <button className="button button-primary" type="submit">Показать вычисление</button>
        </form>
      </div>
    </header> : <AdditionPanel state={state} onEdit={() => dispatch({ type: 'edit' })} onOverview={() => setOverviewOverride(true)} />}

    <div className={`compute-viewport${showing3D ? ' has-3d' : ''}`} data-testid="compute-stage" data-overview={overviewOverride ? 'true' : undefined}>
      {state ? showing3D ? <>
        <Suspense fallback={<div className="compute-3d-loading">Загрузка объёмной модели…</div>}><Arithmetic3D state={state} overview={overviewOverride} resetToken={cameraResetToken} reducedMotion={reducedMotion} onContextLost={handleContextLost} /></Suspense>
        <div className="compute-sr-route"><FlatRoute state={state} /></div>
      </> : <FlatRoute state={state} /> : <div className="compute-empty-state"><div className="compute-empty-mark">A <span>+</span> B <span>→</span> Σ</div><p>Четыре полных сумматора · один путь данных · девять шагов</p><span>3D-сцена появится после запуска вычисления</span></div>}
      {state && (state.chapter === 'alu' || state.chapter === 'result') && <AdditionTable state={state} collapsed={tableCollapsed} onToggle={() => setTableCollapsed((value) => !value)} />}
      <div className="compute-viewport-footer"><span>● ДАННЫЕ &nbsp; ◆ ПЕРЕНОС</span><span>{webgl === false ? 'WEBGL НЕДОСТУПЕН · ПЛОСКИЙ ПУТЬ' : reducedMotion ? 'МГНОВЕННЫЕ ПЕРЕХОДЫ' : 'РУЧНОЙ РЕЖИМ ПО УМОЛЧАНИЮ'}</span>{showing3D && <button type="button" onClick={() => { setOverviewOverride(false); setCameraResetToken((value) => value + 1); }}>Вернуть камеру</button>}{state && webgl === true && <button type="button" onClick={() => setFlatMode((value) => !value)}>{flatMode ? 'Показать 3D' : 'Плоский вид'}</button>}</div>
    </div>

    {state && <div className="compute-controls">
      <div className="compute-chapters" role="toolbar" aria-label="Главы вычисления" onKeyDown={chapterKeyDown}>
        {CHAPTERS.map((chapter) => <button key={chapter} type="button" data-chapter={chapter} className={state.chapter === chapter ? 'is-current' : ''} aria-current={state.chapter === chapter ? 'step' : undefined} onClick={() => dispatch({ type: 'jump-chapter', chapter })}><span>{CHAPTER_LABELS[chapter]}</span><small>{CHAPTER_RANGES[chapter]}</small></button>)}
      </div>
      <div className="compute-controls-row">
        <button className="button button-ghost" type="button" onClick={() => dispatch({ type: 'previous' })}>Назад</button>
        <button className="button button-primary" type="button" disabled={state.step === 9} onClick={() => dispatch({ type: 'next' })}>Дальше</button>
        <span className="compute-controls-spacer" />
        <button className="button button-ghost" type="button" onClick={() => dispatch({ type: controller.playing ? 'pause' : 'play' })} disabled={state.step === 9 && !controller.playing}>{controller.playing ? 'Пауза' : 'Воспроизвести'}</button>
        <label className="compute-speed">Скорость <select value={controller.speed} onChange={(event) => dispatch({ type: 'speed', speed: Number(event.target.value) as PlaybackSpeed })}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
      </div>
    </div>}
    <p className="compute-boundary">Это логическая модель четырёхразрядного сумматора, а не тактовая или электрическая эмуляция конкретного процессора. Путь импульсов не повторяет физические дорожки платы.</p>
    <div className="compute-live" aria-live="polite" aria-atomic="true">{formatAnnouncement(controller.announcement, controller.trace)}</div>
  </section>;
}
