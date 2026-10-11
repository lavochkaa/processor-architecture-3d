import type { AdditionTraceState, TraceSignal } from '../../domain/arithmetic/buildTrace';

export interface TransitionMotion {
  readonly signals: readonly TraceSignal[];
  readonly reverse: boolean;
}

/** Chapter jumps are snapshots; only adjacent steps have a meaningful travel direction. */
export function motionForTransition(previous: AdditionTraceState | null, next: AdditionTraceState | null): TransitionMotion {
  if (!previous || !next) return { signals: [], reverse: false };
  if (next.step === previous.step + 1) return { signals: next.signals, reverse: false };
  if (next.step === previous.step - 1) return { signals: previous.signals, reverse: true };
  return { signals: [], reverse: false };
}
