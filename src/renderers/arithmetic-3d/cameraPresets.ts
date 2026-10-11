import type { CameraKey } from '../../domain/arithmetic/buildTrace';
import type { Point3 } from './sceneLayout';

export interface CameraPose {
  readonly position: Point3;
  readonly target: Point3;
}

const DESKTOP: Record<CameraKey, CameraPose> = {
  board: { position: [0, 6.6, 8.5], target: [0, 0, 0] },
  'alu-closeup': { position: [-.38, 3.35, 4.5], target: [-.38, -.12, 0] },
  result: { position: [2.15, 6.25, 7.8], target: [2.15, 0, 0] }
};

const COMPACT: Record<CameraKey, CameraPose> = {
  board: { position: [0, 14.2, 14.6], target: [0, 0, 0] },
  'alu-closeup': { position: [1.02, 5.8, 7.8], target: [1.02, .1, 0] },
  result: { position: [4.35, 6.2, 8], target: [4.35, .1, 0] }
};
const NARROW_BOARD: CameraPose = { position: [0, 14.5, 21], target: [0, 0, 0] };
const INPUT_FOCUS: CameraPose = { position: [-5.05, 3.1, 4.2], target: [-5.05, 0, 0] };
const NARROW_INPUT_FOCUS: CameraPose = { position: [-5.35, 3.6, 5], target: [-5.35, 0, 0] };

/** Scene-only positions; arithmetic and captions use camera keys, not coordinates. */
export function cameraPoseFor(key: CameraKey, compact: boolean, overview = false, narrow = false): CameraPose {
  const selected = overview ? 'board' : key;
  if (compact && narrow && selected === 'board') return NARROW_BOARD;
  return (compact ? COMPACT : DESKTOP)[selected];
}

export function inputCameraPose(narrow = false): CameraPose {
  return narrow ? NARROW_INPUT_FOCUS : INPUT_FOCUS;
}
