import { buildTrace, type AdditionTraceState, type ChapterKey } from './buildTrace';
import { computeAddition } from './computeAddition';

export type PlaybackSpeed = 0.5 | 1 | 2;
export type Announcement =
  | Readonly<{ kind: 'step'; step: number }>
  | Readonly<{ kind: 'chapter'; chapter: ChapterKey; step: number }>
  | Readonly<{ kind: 'stop'; step: number }>;

export interface ControllerState {
  readonly trace: readonly AdditionTraceState[] | null;
  readonly stepIndex: number;
  readonly playing: boolean;
  readonly speed: PlaybackSpeed;
  readonly announcement: Announcement | null;
}

export type ControllerAction =
  | { type: 'start'; a: number; b: number }
  | { type: 'edit' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'jump-chapter'; chapter: ChapterKey }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'speed'; speed: PlaybackSpeed };

const FIRST_STEP_BY_CHAPTER: Record<ChapterKey, number> = {
  input: 0,
  memory: 2,
  alu: 3,
  result: 7
};

export function createControllerState(): ControllerState {
  return { trace: null, stepIndex: 0, playing: false, speed: 1, announcement: null };
}

export function currentTraceState(state: ControllerState): AdditionTraceState | null {
  return state.trace?.[state.stepIndex] ?? null;
}

export function reduceController(state: ControllerState, action: ControllerAction): ControllerState {
  switch (action.type) {
    case 'start':
      return {
        trace: buildTrace(computeAddition(action.a, action.b)),
        stepIndex: 0,
        playing: false,
        speed: state.speed,
        announcement: { kind: 'step', step: 1 }
      };
    case 'edit':
      return { ...state, trace: null, stepIndex: 0, playing: false, announcement: null };
    case 'next': {
      if (!state.trace) return state;
      const stepIndex = Math.min(state.trace.length - 1, state.stepIndex + 1);
      return { ...state, stepIndex, playing: false, announcement: { kind: 'step', step: stepIndex + 1 } };
    }
    case 'previous': {
      if (!state.trace) return state;
      if (state.stepIndex === 0) return reduceController(state, { type: 'edit' });
      const stepIndex = state.stepIndex - 1;
      return { ...state, stepIndex, playing: false, announcement: { kind: 'step', step: stepIndex + 1 } };
    }
    case 'jump-chapter': {
      if (!state.trace) return state;
      const stepIndex = FIRST_STEP_BY_CHAPTER[action.chapter];
      return { ...state, stepIndex, playing: false, announcement: { kind: 'step', step: stepIndex + 1 } };
    }
    case 'play':
      if (!state.trace || state.stepIndex >= state.trace.length - 1) return state;
      return { ...state, playing: true, announcement: null };
    case 'pause':
      return state.playing
        ? { ...state, playing: false, announcement: { kind: 'stop', step: state.stepIndex + 1 } }
        : state;
    case 'tick': {
      if (!state.playing || !state.trace) return state;
      const stepIndex = Math.min(state.trace.length - 1, state.stepIndex + 1);
      const reachedEnd = stepIndex === state.trace.length - 1;
      const chapterChanged = state.trace[stepIndex].chapter !== state.trace[state.stepIndex].chapter;
      const announcement: Announcement | null = reachedEnd
        ? { kind: 'stop', step: stepIndex + 1 }
        : chapterChanged
          ? { kind: 'chapter', chapter: state.trace[stepIndex].chapter, step: stepIndex + 1 }
          : null;
      return { ...state, stepIndex, playing: !reachedEnd, announcement };
    }
    case 'speed':
      return { ...state, speed: action.speed };
  }
}
