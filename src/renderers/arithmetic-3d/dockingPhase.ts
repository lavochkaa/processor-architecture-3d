export interface DockingFrame {
  /** Position on the route; the final part of the animation stays at the receiver. */
  readonly routePhase: number;
  readonly packetOpacity: number;
  readonly destinationOpacity: number;
  readonly dockingProgress: number;
}

const DOCK_START = .78;

/** Integrate speed per frame so changing the selector cannot restart a packet. */
export function advanceDockingClock(elapsedSeconds: number, frameSeconds: number, speed: number): number {
  return elapsedSeconds + Math.max(0, frameSeconds) * speed;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Travel and landing are one continuous, reversible transition. */
export function dockingFrame(progress: number, reverse = false): DockingFrame {
  const position = reverse ? 1 - clamp(progress) : clamp(progress);
  const routePhase = clamp(position / DOCK_START);
  const dockingProgress = clamp((position - DOCK_START) / (1 - DOCK_START));
  const eased = dockingProgress * dockingProgress * (3 - 2 * dockingProgress);
  return {
    routePhase,
    packetOpacity: 1 - eased,
    destinationOpacity: eased,
    dockingProgress: eased
  };
}
