import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, type Group, type Material } from 'three';
import type { Bit } from '../../domain/arithmetic/computeAddition';
import type { TraceSignal } from '../../domain/arithmetic/buildTrace';
import { pointOnRoute, routeForSignal } from './signalPaths';
import { advanceDockingClock, dockingFrame } from './dockingPhase';
import { receiverDock, type ReceiverDock } from './dockingSlots';
import { TextLabel } from './TextLabel';

type Vec3 = [number, number, number];

function SignalGlyph({ shape, value, label, bits, opacity = 1 }: { shape: 'packet' | 'diamond'; value: Bit | null; label: string | null; bits: string | null; opacity?: number }) {
  const filled = value !== 0;
  return <>
    {shape === 'packet' ? <>
      <mesh><boxGeometry args={[bits && bits.length > 1 ? 1 : .52, .11, bits && bits.length > 1 ? .48 : .34]} /><meshBasicMaterial color="#eef0ef" transparent opacity={opacity} depthWrite={false} /></mesh>
      <TextLabel text={`${label ?? ''} ${bits ?? ''}`} color="#111315" position={[0, .065, 0]} width={bits && bits.length > 1 ? .88 : .45} compact opacity={opacity} />
    </> : filled
      ? <mesh rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[.18, 0]} /><meshBasicMaterial color="#f2f4f4" transparent opacity={opacity} depthWrite={false} /></mesh>
      : <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[.19, .025, .19]} /><meshBasicMaterial color="#f2f4f4" wireframe transparent opacity={opacity} depthWrite={false} /></mesh>}
    {shape === 'diamond' && value !== null && <TextLabel text={label ?? String(value)} color="#f2f4f4" position={[.29, .025, 0]} width={.32} compact opacity={opacity} />}
  </>;
}

export function CarryMarker({ value, position, label }: { value: Bit; position: Vec3; label?: string }) {
  return <group position={position}><SignalGlyph shape="diamond" value={value} label={label ?? null} bits={null} /></group>;
}

function ReceiverGlyph({ dock, opacity }: { dock: ReceiverDock; opacity: number }) {
  if (dock.kind === 'carry') return <group position={[...dock.point]}><SignalGlyph shape="diamond" value={1} label="c" bits={null} opacity={opacity} /></group>;
  if (dock.kind === 'screen') return <group position={[...dock.point]}><TextLabel text={dock.value} position={[0, 0, 0]} width={.9} vertical compact opacity={opacity} /></group>;
  const digits = [...dock.value];
  return <group position={[...dock.point]}>{digits.map((digit, index) => {
    const width = dock.width / digits.length;
    const one = digit === '1';
    return <group key={index} position={[(index - (digits.length - 1) / 2) * width, 0, 0]}>
      <mesh><boxGeometry args={[width - .035, .08, .3]} /><meshStandardMaterial color={one ? '#e8e8e6' : '#17191b'} metalness={.25} roughness={.6} transparent opacity={opacity} depthWrite={false} /></mesh>
      <TextLabel text={digit} color={one ? '#111214' : '#eee'} position={[0, .048, 0]} width={width - .05} opacity={opacity} />
    </group>;
  })}</group>;
}

function setOpacity(group: Group | null, opacity: number) {
  group?.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material: Material) => { material.opacity = opacity; });
  });
}

/** Follow the visible route until the destination can reveal its data. */
export function SignalActors({ signals, reverse, speed, reducedMotion, onSettled }: {
  signals: readonly TraceSignal[]; reverse: boolean; speed: number; reducedMotion: boolean; onSettled: () => void;
}) {
  const { invalidate } = useThree();
  const routes = useMemo(() => signals.map(routeForSignal), [signals]);
  const docks = useMemo(() => signals.map(receiverDock), [signals]);
  const groups = useRef<(Group | null)[]>([]);
  const receivers = useRef<(Group | null)[]>([]);
  const elapsedSeconds = useRef(0);
  const complete = useRef(false);
  const settledCallback = useRef(onSettled);
  useEffect(() => { settledCallback.current = onSettled; }, [onSettled]);
  const settle = useCallback(() => {
    if (complete.current) return;
    complete.current = true;
    routes.forEach((route, index) => groups.current[index]?.position.set(...pointOnRoute(route, reverse ? 0 : 1)));
    routes.forEach((_, index) => {
      groups.current[index]?.scale.set(1, 1, 1);
      setOpacity(groups.current[index], reverse ? 1 : 0);
      setOpacity(receivers.current[index], reverse ? 0 : 1);
    });
    invalidate();
    settledCallback.current();
  }, [routes, reverse, invalidate]);

  useEffect(() => {
    elapsedSeconds.current = 0;
    complete.current = false;
    if (routes.length === 0) {
      complete.current = true;
      return;
    }
    const initial = dockingFrame(0, reverse);
    routes.forEach((_, index) => {
      setOpacity(groups.current[index], initial.packetOpacity);
      setOpacity(receivers.current[index], initial.destinationOpacity);
    });
    if (reducedMotion) {
      settle();
      return;
    }
    invalidate();
    const timer = window.setTimeout(settle, 5000);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, routes, reverse, invalidate, settle]);

  useFrame((_, delta) => {
    if (complete.current || reducedMotion) return;
    elapsedSeconds.current = advanceDockingClock(elapsedSeconds.current, delta, speed);
    const phase = Math.min(1, elapsedSeconds.current / 1.12);
    const eased = phase * phase * (3 - 2 * phase);
    const frame = dockingFrame(eased, reverse);
    routes.forEach((route, index) => {
      const position = pointOnRoute(route, frame.routePhase);
      groups.current[index]?.position.set(position[0], position[1] + Math.sin(frame.routePhase * Math.PI) * .16 * (1 - frame.dockingProgress), position[2]);
      groups.current[index]?.scale.set(1 - frame.dockingProgress * .45, 1, 1 - frame.dockingProgress * .45);
      setOpacity(groups.current[index], frame.packetOpacity);
      setOpacity(receivers.current[index], frame.destinationOpacity);
    });
    if (phase >= 1) {
      settle();
    } else invalidate();
  });

  return <>{signals.map((signal, index) => <group key={`${signal.from}-${signal.to}-${signal.bitIndex ?? 'all'}`}>
    <group ref={(node) => { groups.current[index] = node; }} position={[...pointOnRoute(routes[index], reverse ? 1 : 0)]}>
      <SignalGlyph shape={signal.shape} value={signal.value} label={signal.label} bits={signal.bits} opacity={reverse ? 0 : 1} />
    </group>
    <group ref={(node) => { receivers.current[index] = node; }}><ReceiverGlyph dock={docks[index]} opacity={reverse ? 1 : 0} /></group>
  </group>)}</>;
}
