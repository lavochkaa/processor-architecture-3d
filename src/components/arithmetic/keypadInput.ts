export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '⌫' | 'A/B';

export interface KeypadInputState {
  readonly a: string;
  readonly b: string;
  readonly selected: 'a' | 'b';
}

export function applyKeypadInput(state: KeypadInputState, key: KeypadKey): KeypadInputState {
  if (key === 'A/B') return { ...state, selected: state.selected === 'a' ? 'b' : 'a' };
  const current = state[state.selected];
  const next = key === '⌫' ? current.slice(0, -1) : current + key;
  return { ...state, [state.selected]: next };
}
