export type DetailLevel = 'basic' | 'deeper' | 'expert';
export type RenderMode = '3d' | '2d' | 'text';
export type Phase = 'idle' | 'step' | 'completed' | 'knowledge-check';

export interface ScenarioState {
  phase: Phase;
  stepIndex: number;
  detailLevel: DetailLevel;
  renderMode: RenderMode;
  playing: boolean;
  answers: Record<string, string>;
}

export const initialScenarioState: ScenarioState = {
  phase: 'idle',
  stepIndex: 0,
  detailLevel: 'basic',
  renderMode: '2d',
  playing: false,
  answers: {}
};

export type ScenarioAction =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'SET_DETAIL'; detail: DetailLevel }
  | { type: 'SET_RENDER_MODE'; mode: RenderMode }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'OPEN_QUIZ' }
  | { type: 'ANSWER'; questionId: string; optionId: string }
  | { type: 'RESTART' };

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'step', stepIndex: 0, answers: {}, playing: false };
    case 'NEXT':
      if (state.phase !== 'step') return state;
      return state.stepIndex === 7
        ? { ...state, phase: 'completed', playing: false }
        : { ...state, stepIndex: state.stepIndex + 1 };
    case 'PREVIOUS':
      return { ...state, phase: 'step', stepIndex: Math.max(0, state.stepIndex - 1), playing: false };
    case 'GO_TO_STEP':
      return { ...state, phase: 'step', stepIndex: Math.max(0, Math.min(7, action.index)), playing: false };
    case 'SET_DETAIL':
      return { ...state, detailLevel: action.detail };
    case 'SET_RENDER_MODE':
      return { ...state, renderMode: action.mode };
    case 'SET_PLAYING':
      return { ...state, playing: action.playing && state.phase === 'step' };
    case 'OPEN_QUIZ':
      return { ...state, phase: 'knowledge-check', playing: false };
    case 'ANSWER':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.optionId } };
    case 'RESTART':
      return { ...initialScenarioState, detailLevel: state.detailLevel, renderMode: state.renderMode };
  }
}
