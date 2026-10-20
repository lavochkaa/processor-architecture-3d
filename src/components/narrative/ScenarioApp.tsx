import { lazy, Suspense, useCallback, useEffect, useReducer, useState } from 'react';
import type { Scenario } from '../../content/scenarios/schema';
import { termsById } from '../../content/glossary/terms';
import { canCreateWebGLContext, resolveRenderMode } from '../../domain/capabilities/capabilities';
import { initialScenarioState, scenarioReducer, type DetailLevel, type RenderMode } from '../../domain/scenario-engine/scenario';
import { Scene2D } from '../../renderers/scene-2d/Scene2D';

const Scene3D = lazy(() => import('../../renderers/scene-3d/Scene3D'));
const metaphor = 'Световой поток — метафора перехода сообщения или состояния, а не буквальная траектория электрона.';
const detailLabels: Record<DetailLevel, string> = { basic: 'Базовый', deeper: 'Глубже', expert: 'Экспертный' };
const modeLabels: Record<RenderMode, string> = { '2d': 'Схема', '3d': '3D-сцена', text: 'Текст' };

export default function ScenarioApp({ scenario }: { scenario: Scenario }) {
  const [state, dispatch] = useReducer(scenarioReducer, initialScenarioState);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [resetToken, setResetToken] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const step = scenario.steps[state.stepIndex];
  const resolvedMode = resolveRenderMode(state.renderMode, webglAvailable === true);

  useEffect(() => {
    setIsHydrated(true);
    setWebglAvailable(canCreateWebGLContext());
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!state.playing || state.phase !== 'step' || reducedMotion) return;
    const timer = window.setTimeout(() => dispatch({ type: 'NEXT' }), 2200);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.phase, state.stepIndex, reducedMotion]);

  const handleContextLost = useCallback(() => {
    setWebglAvailable(false);
    dispatch({ type: 'SET_RENDER_MODE', mode: '2d' });
    setFallbackMessage('3D-сцена недоступна. Продолжаем на схеме с того же шага.');
  }, []);

  function chooseMode(mode: RenderMode) {
    if (mode === '3d' && webglAvailable === false) {
      setFallbackMessage('WebGL недоступен. Схема показывает весь тот же маршрут.');
      dispatch({ type: 'SET_RENDER_MODE', mode: '2d' });
      return;
    }
    setFallbackMessage('');
    dispatch({ type: 'SET_RENDER_MODE', mode });
  }

  if (state.phase === 'idle') {
    return <section className="intro-card" aria-labelledby="start-heading">
      <div className="eyebrow"><span className="eyebrow-dot" /> ИНТЕРАКТИВНАЯ МОДЕЛЬ / 08 ЭТАПОВ</div>
      <h2 id="start-heading">Одна клавиша.<br /><em>Несколько систем.</em></h2>
      <p>Нажмите условную клавишу и проследите, как действие превращается в символ в поле браузера.</p>
      <div className="intro-visual" aria-hidden="true"><span className="keycap">A</span><span className="intro-line" /><span className="screen-glyph">a<span className="cursor" /></span></div>
      <button className="button button-primary" disabled={!isHydrated} onClick={() => dispatch({ type: 'START' })}>Нажать клавишу A <span aria-hidden="true">↗</span></button>
      <p className="fine-print">Профиль: USB-клавиатура · настольный ПК · активное поле браузера · латинская буква без IME. Реальные системы могут работать иначе.</p>
    </section>;
  }

  return <section className="lab" aria-label="Интерактивный сценарий">
    <div className="lab-toolbar">
      <div className="lab-id"><span className="lab-orbit" aria-hidden="true" /> СЦЕНАРИЙ 01 <span className="lab-separator">/</span> КЛАВИША → СИМВОЛ</div>
      <div className="mode-switch" role="group" aria-label="Режим представления">
        {(['2d', '3d', 'text'] as const).map((mode) => <button key={mode} type="button" aria-pressed={state.renderMode === mode} onClick={() => chooseMode(mode)}>{modeLabels[mode]}</button>)}
      </div>
    </div>
    {fallbackMessage && <p className="notice" role="status">{fallbackMessage}</p>}
    <div className="lab-grid">
      <div className="visual-column">
        {resolvedMode === '2d' && <Scene2D step={step} />}
        {resolvedMode === '3d' && <div className="diagram diagram-3d" data-testid="3d-wrapper">
          <div className="diagram-topline"><span>ПРОСТРАНСТВЕННАЯ МОДЕЛЬ</span><span>ВРАЩАЙТЕ МЫШЬЮ · МАСШТАБИРУЙТЕ КОЛЕСОМ</span></div>
          <Suspense fallback={<p className="loading-scene">Загрузка 3D-сцены…</p>}><Scene3D cue={step.visualCue} resetToken={resetToken} onContextLost={handleContextLost} /></Suspense>
          <div className="scene-footer"><span>Активный узел: {step.title}</span><button type="button" onClick={() => setResetToken((value) => value + 1)}>Вернуть к сюжету</button></div>
        </div>}
        {resolvedMode === 'text' && <div className="text-scene" data-testid="scene-text"><span className="eyebrow">ТЕКСТОВЫЙ МАРШРУТ</span><strong>{String(step.order).padStart(2, '0')} / {step.title}</strong><p>{step.accessibilityNarration}</p><p>Следующий этап выбирается ниже или кнопкой «Следующий шаг».</p></div>}
        <div className="browser-field"><label htmlFor="simulated-input">ПОЛЕ ВВОДА БРАУЗЕРА / СИМУЛЯЦИЯ</label><input id="simulated-input" readOnly value={state.stepIndex === 7 ? 'a' : ''} placeholder="Здесь появится символ" aria-describedby="simulated-note" /><span id="simulated-note">Значение меняется только в учебной модели. Настоящие клавиши не записываются.</span></div>
        <div className="flow-legend" aria-label="Легенда сигналов"><span><i className="legend-input" /> Ввод</span><span><i className="legend-event" /> Событие</span><span><i className="legend-state" /> Состояние</span><span><i className="legend-frame" /> Кадр</span></div>
        <p className="metaphor-note">{metaphor}</p>
      </div>
      <article className="step-card" aria-labelledby="step-title">
        <div className="step-counter"><span>ЭТАП {String(step.order).padStart(2, '0')} / 08</span><span className="step-rule" /></div>
        <h2 id="step-title">{step.title}</h2>
        <div className="observation"><span>ЧТО ВИДИТ ПОЛЬЗОВАТЕЛЬ</span><p>{step.userObservation}</p></div>
        <div className="detail-switch" role="group" aria-label="Уровень детализации">
          {(['basic', 'deeper', 'expert'] as const).map((detail) => <button type="button" key={detail} aria-pressed={state.detailLevel === detail} onClick={() => dispatch({ type: 'SET_DETAIL', detail })}>{detailLabels[detail]}</button>)}
        </div>
        <div className="explanation" aria-live="polite"><span>ОБЪЯСНЕНИЕ</span><p>{step.explanation.basic}</p>{state.detailLevel !== 'basic' && <p>{step.explanation.deeper}</p>}{state.detailLevel === 'expert' && <p>{step.explanation.expert}</p>}</div>
        <details className="simplification"><summary>Что здесь упрощено <span aria-hidden="true">+</span></summary><ul>{step.omissions.map((item) => <li key={item}>{item}</li>)}</ul><p>В этой модели нельзя утверждать: «{step.prohibitedClaims.join('»; «')}».</p></details>
        <div className="step-links"><span>ТЕРМИНЫ</span>{step.glossaryRefs.map((id) => { const term = termsById.get(id); return term ? <a href={`/glossary/#${id}`} key={id}>{term.title} ↗</a> : null; })}</div>
        <div className="step-links sources"><span>ИСТОЧНИКИ</span>{step.sourceRefs.map((id) => { const source = scenario.sources.find((item) => item.id === id); return source ? <a href={source.url} target="_blank" rel="noreferrer" key={id}>{source.title} ↗</a> : null; })}</div>
      </article>
    </div>
    <div className="timeline" aria-label="Этапы сценария">
      {scenario.steps.map((item, index) => <button key={item.id} type="button" aria-current={index === state.stepIndex ? 'step' : undefined} onClick={() => dispatch({ type: 'GO_TO_STEP', index })}>
        <span className="timeline-index">{String(item.order).padStart(2, '0')}</span><span className="timeline-title">{item.title}</span>
      </button>)}
    </div>
    {state.phase !== 'knowledge-check' && <div className="lab-actions">
      <button className="button button-ghost" type="button" onClick={() => dispatch({ type: 'PREVIOUS' })} disabled={state.stepIndex === 0 && state.phase === 'step'}>← Назад</button>
      <span className="progress-text">{step.order} из 8 этапов</span>
      {state.phase === 'step' && !reducedMotion && <button className="button button-quiet" type="button" aria-pressed={state.playing} onClick={() => dispatch({ type: 'SET_PLAYING', playing: !state.playing })}>{state.playing ? 'Пауза' : 'Автовоспроизведение'}</button>}
      {state.phase === 'step' ? <button className="button button-primary" type="button" onClick={() => dispatch({ type: 'NEXT' })}>{state.stepIndex === 7 ? 'Завершить маршрут' : 'Следующий шаг'} →</button> : <button className="button button-primary" type="button" onClick={() => dispatch({ type: 'OPEN_QUIZ' })}>Проверить понимание →</button>}
    </div>}
    {state.phase === 'knowledge-check' && <section className="quiz" aria-labelledby="quiz-title">
      <div className="eyebrow">ЗАКРЕПЛЕНИЕ / 04 ВОПРОСА</div>
      <h2 id="quiz-title">Теперь попробуйте предсказать путь</h2>
      <p>Без таймера. После выбора сразу покажем объяснение.</p>
      <div className="quiz-grid">{scenario.assessment.map((question, index) => <fieldset key={question.id} className="quiz-item">
        <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.prompt}</legend>
        {question.options.map((option) => <label key={option.id}><input type="radio" name={question.id} checked={state.answers[question.id] === option.id} onChange={() => dispatch({ type: 'ANSWER', questionId: question.id, optionId: option.id })} />{option.label}</label>)}
        {state.answers[question.id] && <p className={state.answers[question.id] === question.correctOptionId ? 'answer correct' : 'answer incorrect'} role="status">{state.answers[question.id] === question.correctOptionId ? 'Верно. ' : 'Не совсем. '}{question.explanation}</p>}
      </fieldset>)}</div>
      <button className="button button-ghost" type="button" onClick={() => dispatch({ type: 'RESTART' })}>Пройти ещё раз ↺</button>
    </section>}
  </section>;
}
