import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import type { Bit } from '../../domain/arithmetic/computeAddition';
import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import { resolveSignalPath } from './signalPaths';
import { TextLabel } from './TextLabel';

type Vec3 = [number, number, number];

function SignalGlyph({ shape, value }: { shape: 'circle' | 'diamond'; value: Bit | null }) {
  const filled = value !== 0;
  return <>
    {shape === 'circle' ? filled
      ? <mesh><sphereGeometry args={[.14, 14, 10]} /><meshBasicMaterial color="#f2f4f4" /></mesh>
      : <mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.12, .027, 6, 20]} /><meshBasicMaterial color="#f2f4f4" /></mesh>
    : filled
      ? <mesh rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[.18, 0]} /><meshBasicMaterial color="#f2f4f4" /></mesh>
      : <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[.19, .025, .19]} /><meshBasicMaterial color="#f2f4f4" wireframe /></mesh>}
    {value !== null && <TextLabel text={String(value)} color={filled ? '#111315' : '#f2f4f4'} position={[0, filled ? .145 : .025, 0]} width={.2} />}
  </>;
}

export function CarryMarker({ value, position }: { value: Bit; position: Vec3 }) {
  return <group position={position}><SignalGlyph shape="diamond" value={value} /></group>;
}

/** One short transition per trace state; invalidate only while the glyphs move. */
export function SignalActors({ signals, reducedMotion, onSettled }: {
  signals: readonly TraceSignal[]; reducedMotion: boolean; onSettled: () => void;
}) {
  const { invalidate } = useThree();
  const paths = useMemo(() => signals.map(resolveSignalPath), [signals]);
  const groups = useRef<(Group | null)[]>([]);
  const elapsed = useRef(0);
  const complete = useRef(false);

  useEffect(() => {
    if (reducedMotion || paths.length === 0) {
      paths.forEach(([, to], index) => groups.current[index]?.position.set(...to));
      complete.current = true;
      onSettled();
    } else invalidate();
  }, [reducedMotion, paths, invalidate, onSettled]);

  useFrame((_, delta) => {
    if (complete.current || reducedMotion) return;
    elapsed.current = Math.min(.82, elapsed.current + Math.min(delta, .05));
    const phase = elapsed.current / .82;
    const eased = 1 - (1 - phase) ** 3;
    paths.forEach(([from, to], index) => {
      groups.current[index]?.position.set(
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased + Math.sin(phase * Math.PI) * .2,
        from[2] + (to[2] - from[2]) * eased
      );
    });
    if (phase >= 1) {
      complete.current = true;
      onSettled();
    } else invalidate();
  });

  return <>{signals.map((signal, index) => <group key={index} ref={(node) => { groups.current[index] = node; }} position={[...paths[index][0]]}>
    <SignalGlyph shape={signal.shape} value={signal.value} />
  </group>)}</>;
}
