import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { CHAPTER_LABELS, formatAnnouncement } from '../../content/arithmetic/copy';
import type { AdditionTraceState, ChapterKey } from '../../domain/arithmetic/buildTrace';
import { createControllerState, currentTraceState, reduceController, type ControllerAction, type PlaybackSpeed } from '../../domain/arithmetic/controller';
import { OPERAND_ERROR, parseOperand } from '../../domain/arithmetic/parseOperand';
import { canCreateWebGLContext } from '../../domain/capabilities/capabilities';
import { AdditionPanel } from './AdditionPanel';
import { AdditionTable } from './AdditionTable';
import { FlatRoute } from './FlatRoute';
import { applyKeypadInput, type KeypadKey } from './keypadInput';
import { isDirectJump, motionForTransition } from '../../renderers/arithmetic-3d/motionState';

const CHAPTERS: readonly ChapterKey[] = ['input', 'memory', 'alu', 'result'];
const Arithmetic3D = lazy(() => import('../../renderers/arithmetic-3d/Arithmetic3D'));
const CHAPTER_RANGES: Record<ChapterKey, string> = {
  input: '1–2', memory: '3', alu: '4–7', result: '8–10'
};

export default function ComputeApp() {
  const [controller, dispatch] = useReducer(reduceController, undefined, createControllerState);
  const [aInput, setAInput] = useState('11');
  const [bInput, setBInput] = useState('6');
  const [selectedInput, setSelectedInput] = useState<'a' | 'b'>('a');
  const [pressedKey, setPressedKey] = useState<KeypadKey | null>(null);
  const [touched, setTouched] = useState({ a: false, b: false });
  const [tableCollapsed, setTableCollapsed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [overviewOverride, setOverviewOverride] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [flatMode, setFlatMode] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [presentedState, setPresentedState] = useState<AdditionTraceState | null>(null);
  const [hasQueuedNavigation, setHasQueuedNavigation] = useState(false);
  const navigationBusy = useRef(false);
  const queuedNavigation = useRef<ControllerAction | null>(null);
  const aRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);
  const state = currentTraceState(controller);
  const aError = touched.a && parseOperand(aInput) === null;
  const bError = touched.b && parseOperand(bInput) === null;
  const showing3D = webgl === true && !flatMode;
  const synchronizedState = showing3D && state ? presentedState ?? state : state;
  const clearNavigation = useCallback(() => {
    navigationBusy.current = false;
    queuedNavigation.current = null;
    setHasQueuedNavigation(false);
  }, []);
  const handleContextLost = useCallback(() => { clearNavigation(); setWebgl(false); setFlatMode(true); }, [clearNavigation]);
  const navigate = useCallback((action: ControllerAction) => {
    const next = reduceController(controller, action);
    if (!showing3D || reducedMotion || !next.trace) {
      clearNavigation();
      dispatch(action);
      return;
    }
    if (next.stepIndex === controller.stepIndex) {
      dispatch(action);
      return;
    }
    if (navigationBusy.current) {
      queuedNavigation.current = action;
      setHasQueuedNavigation(true);
      return;
    }
    navigationBusy.current = true;
    dispatch(action);
  }, [controller, showing3D, reducedMotion, clearNavigation]);
  const handleSceneSettled = useCallback((settled: AdditionTraceState) => {
    if (state !== settled) return;
    setPresentedState(settled);
    navigationBusy.current = false;
    const queued = queuedNavigation.current;
    if (!queued) return;
    queuedNavigation.current = null;
    setHasQueuedNavigation(false);
    const next = reduceController(controller, queued);
    if (showing3D && !reducedMotion && next.trace && next.stepIndex !== controller.stepIndex) navigationBusy.current = true;
    dispatch(queued);
  }, [state, controller, showing3D, reducedMotion]);

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
    const timer = window.setTimeout(() => navigate({ type: 'tick' }), 1600 / controller.speed);
    return () => window.clearTimeout(timer);
  }, [controller.playing, controller.stepIndex, controller.speed, navigate]);

  useEffect(() => setOverviewOverride(false), [state?.cameraKey]);

  useEffect(() => {
    setPresentedState((current) => {
      if (!state || !showing3D || reducedMotion) return state;
      if (motionForTransition(current, state).signals.length > 0 || isDirectJump(current, state)) return current;
      return state;
    });
  }, [state, showing3D, reducedMotion]);

  useEffect(() => {
    if (pressedKey === null) return;
    const timer = window.setTimeout(() => setPressedKey(null), 150);
    return () => window.clearTimeout(timer);
  }, [pressedKey]);

  function updateInput(field: 'a' | 'b', value: string) {
    if (field === 'a') setAInput(value);
    else setBInput(value);
    if (parseOperand(value) !== null) setTouched((previous) => ({ ...previous, [field]: false }));
  }

  function pressSceneKey(key: KeypadKey) {
    if (state) return;
    const next = applyKeypadInput({ a: aInput, b: bInput, selected: selectedInput }, key);
    setSelectedInput(next.selected);
    if (next.a !== aInput) updateInput('a', next.a);
    if (next.b !== bInput) updateInput('b', next.b);
    setPressedKey(key);
  }

  function mirrorPhysicalKey(key: string) {
    if (/^[0-9]$/.test(key)) setPressedKey(key as KeypadKey);
    if (key === 'Backspace') setPressedKey('⌫');
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
    setTableCollapsed(window.matchMedia('(max-width: 760px)').matches);
    clearNavigation();
    dispatch({ type: 'start', a, b });
  }

  function chapterKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!(event.target instanceof HTMLButtonElement)) return;
    event.preventDefault();
    const current = CHAPTERS.indexOf(event.target.dataset.chapter as ChapterKey);
    if (current < 0) return;
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    navigate({ type: 'jump-chapter', chapter: CHAPTERS[next] });
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }

  return <section className="compute-app" aria-label="Симуляция сложения двух чисел">
    <div className={`compute-viewport${showing3D ? ' has-3d' : ''}`} data-testid="compute-stage" data-presented-step={synchronizedState?.step ?? undefined} data-overview={overviewOverride ? 'true' : undefined} data-table-expanded={tableCollapsed ? undefined : 'true'}>
    {!state ? <header className="compute-input-panel">
      <div className="compute-panel-top"><span className="compute-eyebrow">ЛОГИЧЕСКАЯ МОДЕЛЬ / ВВОД</span><span>ЧЕТЫРЕ БИТА НА ОПЕРАНД</span></div>
      <div className="compute-input-layout">
      <div><h2>Введите два числа</h2><p>Целые числа от 0 до 15. Модель покажет сложение справа налево и пятибитный ответ.</p><p>3D-клавиатура вводит число {selectedInput.toUpperCase()}.</p></div>
        <form className="compute-form" onSubmit={submit} noValidate>
          <div className="compute-fields">
            <div className={`compute-field${selectedInput === 'a' ? ' is-selected' : ''}`}><label htmlFor="operand-a">Число A</label><input id="operand-a" ref={aRef} type="text" inputMode="numeric" autoComplete="off" value={aInput} aria-label="Число A" aria-invalid={aError ? true : undefined} aria-describedby={aError ? 'operand-a-error' : undefined} onFocus={() => setSelectedInput('a')} onKeyDown={(event) => mirrorPhysicalKey(event.key)} onChange={(event) => updateInput('a', event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, a: true }))} />{aError && <small id="operand-a-error" className="compute-error">{OPERAND_ERROR}</small>}</div>
            <span className="compute-plus" aria-hidden="true">+</span>
            <div className={`compute-field${selectedInput === 'b' ? ' is-selected' : ''}`}><label htmlFor="operand-b">Число B</label><input id="operand-b" ref={bRef} type="text" inputMode="numeric" autoComplete="off" value={bInput} aria-label="Число B" aria-invalid={bError ? true : undefined} aria-describedby={bError ? 'operand-b-error' : undefined} onFocus={() => setSelectedInput('b')} onKeyDown={(event) => mirrorPhysicalKey(event.key)} onChange={(event) => updateInput('b', event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, b: true }))} />{bError && <small id="operand-b-error" className="compute-error">{OPERAND_ERROR}</small>}</div>
          </div>
          <button className="button button-primary" type="submit">Показать вычисление</button>
        </form>
      </div>
    </header> : <AdditionPanel state={synchronizedState ?? state} onEdit={() => { clearNavigation(); dispatch({ type: 'edit' }); }} onOverview={() => setOverviewOverride(true)} />}

      {showing3D ? <>
        <Suspense fallback={<div className="compute-3d-loading">Загрузка объёмной модели…</div>}><Arithmetic3D state={state} displayedState={synchronizedState} overview={overviewOverride} resetToken={cameraResetToken} speed={controller.speed} reducedMotion={reducedMotion} onContextLost={handleContextLost} selectedInput={selectedInput} pressedKey={pressedKey} onKeyPress={pressSceneKey} onSettled={handleSceneSettled} /></Suspense>
        {state && <div className="compute-sr-route"><FlatRoute state={state} /></div>}
      </> : state ? <FlatRoute state={state} /> : <div className="compute-empty-state"><div className="compute-empty-mark">A <span>+</span> B <span>→</span> Σ</div><p>RAM · CPU · четыре полных сумматора · десять шагов</p><span>После запуска значения пройдут по учебному маршруту</span></div>}
      {synchronizedState && (synchronizedState.chapter === 'alu' || synchronizedState.chapter === 'result') && <AdditionTable state={synchronizedState} collapsed={tableCollapsed} onToggle={() => setTableCollapsed((value) => !value)} />}
      <div className="compute-viewport-footer"><span>▰ ЗНАЧЕНИЕ &nbsp; ◆ ПЕРЕНОС</span><span>{webgl === false ? 'WEBGL НЕДОСТУПЕН · ПЛОСКИЙ ПУТЬ' : reducedMotion ? 'МГНОВЕННЫЕ ПЕРЕХОДЫ' : 'РУЧНОЙ РЕЖИМ ПО УМОЛЧАНИЮ'}</span>{showing3D && <button type="button" onClick={() => { setOverviewOverride(false); setCameraResetToken((value) => value + 1); }}>Вернуть камеру</button>}{state && webgl === true && <button type="button" onClick={() => { clearNavigation(); setFlatMode((value) => !value); }}>{flatMode ? 'Показать 3D' : 'Плоский вид'}</button>}</div>
    {state && <div className="compute-controls">
      <div className="compute-chapters" role="toolbar" aria-label="Главы вычисления" onKeyDown={chapterKeyDown}>
        {CHAPTERS.map((chapter) => <button key={chapter} type="button" data-chapter={chapter} className={state.chapter === chapter ? 'is-current' : ''} aria-current={state.chapter === chapter ? 'step' : undefined} onClick={() => navigate({ type: 'jump-chapter', chapter })}><span>{CHAPTER_LABELS[chapter]}</span><small>{CHAPTER_RANGES[chapter]}</small></button>)}
      </div>
      <div className="compute-controls-row">
        <button className="button button-ghost" type="button" onClick={() => navigate({ type: 'previous' })}>Назад</button>
        <button className="button button-primary" type="button" disabled={state.step === 10} onClick={() => navigate({ type: 'next' })}>Дальше</button>
        <span className="compute-controls-spacer" />
        <button className="button button-ghost" type="button" onClick={() => dispatch({ type: controller.playing ? 'pause' : 'play' })} disabled={state.step === 10 && !controller.playing}>{controller.playing ? 'Пауза' : 'Воспроизвести'}</button>
        <label className="compute-speed">Скорость <select value={controller.speed} onChange={(event) => dispatch({ type: 'speed', speed: Number(event.target.value) as PlaybackSpeed })}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
      </div>
      {hasQueuedNavigation && <span className="compute-queued" role="status">Команда ожидает закрепления</span>}
    </div>}
    </div>
    <p className="compute-boundary">Это логическая модель четырёхразрядного сумматора, а не тактовая или электрическая эмуляция конкретного процессора. Путь импульсов не повторяет физические дорожки платы.</p>
    <div className="compute-live" aria-live="polite" aria-atomic="true">{formatAnnouncement(controller.announcement, controller.trace)}</div>
  </section>;
}
