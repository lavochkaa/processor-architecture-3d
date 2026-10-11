import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import type { KeypadKey } from '../../components/arithmetic/keypadInput';
import { CameraRig } from '../shared/CameraRig';
import { BoardWorld } from './BoardWorld';
import { cameraPoseFor, inputCameraPose } from './cameraPresets';
import { actionCalloutFor, anchorForState } from './sceneCallout';
import { SCENE_NODES } from './sceneLayout';
import { isDirectJump } from './motionState';

function ActionAnchor({ point, onPosition }: {
  point: readonly [number, number, number]; onPosition: (position: { x: number; y: number }) => void;
}) {
  const { camera, size, invalidate } = useThree();
  const projected = useRef(new Vector3());
  useEffect(() => invalidate(), [point, invalidate]);
  useFrame(() => {
    projected.current.set(...point).project(camera);
    const margin = Math.min(147, size.width / 2);
    onPosition({
      x: Math.max(margin, Math.min(size.width - margin, (projected.current.x + 1) * size.width / 2)),
      y: Math.max(110, Math.min(size.height - 85, (1 - projected.current.y) * size.height / 2))
    });
  });
  return null;
}

function SceneCamera({ state, overview, resetToken, speed, reducedMotion }: {
  state: AdditionTraceState | null; overview: boolean; resetToken: number; speed: number; reducedMotion: boolean;
}) {
  const compact = useThree(({ size }) => size.width < 650);
  const narrow = useThree(({ size }) => size.width < 420);
  const pose = !state && !overview ? inputCameraPose(narrow) : cameraPoseFor(state?.cameraKey ?? 'board', compact, overview, narrow);
  return <CameraRig position={pose.position} target={pose.target} resetToken={resetToken} reducedMotion={reducedMotion} transitionSeconds={1.12 / speed} />;
}

export default function Arithmetic3D({ state, displayedState, overview, resetToken, speed, reducedMotion, onContextLost, selectedInput, pressedKey, onKeyPress, onSettled }: {
  state: AdditionTraceState | null; overview: boolean; resetToken: number; speed: number; reducedMotion: boolean; onContextLost: () => void;
  displayedState: AdditionTraceState | null; selectedInput: 'a' | 'b'; pressedKey: KeypadKey | null;
  onKeyPress: (key: KeypadKey) => void; onSettled: (state: AdditionTraceState) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [calloutPosition, setCalloutPosition] = useState<{ x: number; y: number } | null>(null);
  const [ssdInfoOpen, setSsdInfoOpen] = useState(false);
  const anchor = useMemo(() => ssdInfoOpen ? [SCENE_NODES.ssd[0], 1.03, SCENE_NODES.ssd[2]] as const : anchorForState(state), [ssdInfoOpen, state]);
  const callout = ssdInfoOpen
    ? { title: 'SSD · накопитель', detail: 'Хранит данные долго. В этом сложении не участвует.' }
    : isDirectJump(displayedState, state)
      ? { title: 'Переход к главе', detail: 'Камера меняет масштаб; данные появятся после перехода.' }
      : actionCalloutFor(state, Boolean(state && displayedState && displayedState !== state));
  useEffect(() => setSsdInfoOpen(false), [state?.step]);
  const positionCallout = useCallback((position: { x: number; y: number }) => {
    setCalloutPosition((current) => current && Math.abs(current.x - position.x) < 1 && Math.abs(current.y - position.y) < 1 ? current : position);
  }, []);
  useEffect(() => {
    const canvas = container.current?.querySelector('canvas');
    if (!canvas) return;
    const handleLost = (event: Event) => { event.preventDefault(); onContextLost(); };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [onContextLost]);
  return <div className="compute-canvas" data-testid="compute-3d" ref={container}>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 6.6, 8.5], fov: 42, near: .1, far: 80 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <SceneCamera state={state} overview={overview} resetToken={resetToken} speed={speed} reducedMotion={reducedMotion} />
      <BoardWorld state={state} speed={speed} reducedMotion={reducedMotion} selectedInput={selectedInput} pressedKey={pressedKey} onKeyPress={onKeyPress} onSettled={onSettled} onInspectSsd={() => setSsdInfoOpen(true)} />
      <ActionAnchor point={anchor} onPosition={positionCallout} />
    </Canvas>
    {calloutPosition && <div className="compute-node-callout" aria-hidden={!ssdInfoOpen} role={ssdInfoOpen ? 'status' : undefined} style={{ left: calloutPosition.x, top: calloutPosition.y }}><strong>{callout.title}</strong><span>{callout.detail}</span></div>}
    <button className="compute-ssd-help" type="button" aria-expanded={ssdInfoOpen} onClick={() => setSsdInfoOpen((open) => !open)}>Что такое SSD?</button>
  </div>;
}
