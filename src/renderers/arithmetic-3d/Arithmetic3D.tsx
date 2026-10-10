import { Canvas, useThree } from '@react-three/fiber';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import { CameraRig } from '../shared/CameraRig';
import { BoardWorld } from './BoardWorld';
import { cameraPoseFor } from './cameraPresets';

function SceneCamera({ state, overview, resetToken, reducedMotion }: {
  state: AdditionTraceState; overview: boolean; resetToken: number; reducedMotion: boolean;
}) {
  const compact = useThree(({ size }) => size.width < 650);
  const pose = cameraPoseFor(state.cameraKey, compact, overview);
  return <CameraRig position={pose.position} target={pose.target} resetToken={resetToken} reducedMotion={reducedMotion} />;
}

export default function Arithmetic3D({ state, overview, resetToken, reducedMotion }: {
  state: AdditionTraceState; overview: boolean; resetToken: number; reducedMotion: boolean;
}) {
  return <div className="compute-canvas" data-testid="compute-3d" aria-hidden="true">
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 6.6, 8.5], fov: 42, near: .1, far: 80 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <SceneCamera state={state} overview={overview} resetToken={resetToken} reducedMotion={reducedMotion} />
      <BoardWorld state={state} />
    </Canvas>
  </div>;
}
