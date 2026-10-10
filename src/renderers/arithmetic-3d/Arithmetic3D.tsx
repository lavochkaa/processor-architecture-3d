import { Canvas } from '@react-three/fiber';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import { BoardWorld } from './BoardWorld';

export default function Arithmetic3D({ state }: { state: AdditionTraceState }) {
  return <div className="compute-canvas" data-testid="compute-3d" aria-hidden="true">
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 6.6, 8.5], fov: 42, near: .1, far: 80 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <BoardWorld state={state} />
    </Canvas>
  </div>;
}
