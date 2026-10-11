import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import type { Bit } from '../../domain/arithmetic/computeAddition';
import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import { pointOnRoute, routeForSignal } from './signalPaths';
import { TextLabel } from './TextLabel';

type Vec3 = [number, number, number];

function SignalGlyph({ shape, value, label, bits }: { shape: 'packet' | 'diamond'; value: Bit | null; label: string | null; bits: string | null }) {
  const filled = value !== 0;
  return <>
    {shape === 'packet' ? <>
      <mesh><boxGeometry args={[bits && bits.length > 1 ? 1 : .52, .11, bits && bits.length > 1 ? .48 : .34]} /><meshBasicMaterial color="#eef0ef" /></mesh>
      <TextLabel text={`${label ?? ''} ${bits ?? ''}`} color="#111315" position={[0, .065, 0]} width={bits && bits.length > 1 ? .88 : .45} compact />
    </> : filled
      ? <mesh rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[.18, 0]} /><meshBasicMaterial color="#f2f4f4" /></mesh>
      : <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[.19, .025, .19]} /><meshBasicMaterial color="#f2f4f4" wireframe /></mesh>}
    {shape === 'diamond' && value !== null && <TextLabel text={label ?? String(value)} color="#f2f4f4" position={[.29, .025, 0]} width={.32} compact />}
  </>;
}

export function CarryMarker({ value, position }: { value: Bit; position: Vec3 }) {
  return <group position={position}><SignalGlyph shape="diamond" value={value} label={null} bits={null} /></group>;
}

/** Follow the visible route until the destination can reveal its data. */
export function SignalActors({ signals, reverse, speed, reducedMotion, onSettled }: {
  signals: readonly TraceSignal[]; reverse: boolean; speed: number; reducedMotion: boolean; onSettled: () => void;
}) {
  const { invalidate } = useThree();
  const routes = useMemo(() => signals.map(routeForSignal), [signals]);
  const groups = useRef<(Group | null)[]>([]);
  const startedAt = useRef(0);
  const complete = useRef(false);
  const duration = 1.12 / speed;
  const settle = useCallback(() => {
    if (complete.current) return;
    complete.current = true;
    routes.forEach((route, index) => groups.current[index]?.position.set(...pointOnRoute(route, reverse ? 0 : 1)));
    invalidate();
    onSettled();
  }, [routes, reverse, invalidate, onSettled]);

  useEffect(() => {
    startedAt.current = performance.now();
    complete.current = false;
    if (routes.length === 0) {
      complete.current = true;
      return;
    }
    if (reducedMotion) {
      settle();
      return;
    }
    invalidate();
    const timer = window.setTimeout(settle, duration * 1000 + 80);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, routes, invalidate, duration, settle]);

  useFrame(() => {
    if (complete.current || reducedMotion) return;
    const phase = Math.min(1, (performance.now() - startedAt.current) / (duration * 1000));
    const eased = phase * phase * (3 - 2 * phase);
    routes.forEach((route, index) => {
      const position = pointOnRoute(route, reverse ? 1 - eased : eased);
      groups.current[index]?.position.set(position[0], position[1] + Math.sin(phase * Math.PI) * .16, position[2]);
    });
    if (phase >= 1) {
      settle();
    } else invalidate();
  });

  return <>{signals.map((signal, index) => <group key={index} ref={(node) => { groups.current[index] = node; }} position={[...pointOnRoute(routes[index], reverse ? 1 : 0)]}>
    <SignalGlyph shape={signal.shape} value={signal.value} label={signal.label} bits={signal.bits} />
  </group>)}</>;
}
