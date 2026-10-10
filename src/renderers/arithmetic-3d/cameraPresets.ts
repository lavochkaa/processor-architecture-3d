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
  board: { position: [-3.4, 7.6, 8.6], target: [-3.4, 0, 0] },
  'alu-closeup': { position: [1.02, 5.3, 6.9], target: [1.02, -.85, 0] },
  result: { position: [4.35, 5.6, 7.1], target: [4.35, -.65, 0] }
};

/** Scene-only positions; arithmetic and captions use camera keys, not coordinates. */
export function cameraPoseFor(key: CameraKey, compact: boolean, overview = false): CameraPose {
  return (compact ? COMPACT : DESKTOP)[overview ? 'board' : key];
}
