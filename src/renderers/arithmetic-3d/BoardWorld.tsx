import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { Object3D, type InstancedMesh } from 'three';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import { adderPosition, SCENE_NODES, type Point3 } from './sceneLayout';
import { TextLabel } from './TextLabel';
import { CarryMarker, SignalActors } from './SignalActors';

type Vec3 = [number, number, number];

function InstancedPads({ positions, size, color }: { positions: readonly Vec3[]; size: Vec3; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new Object3D();
    positions.forEach((position, index) => {
      object.position.set(...position);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [positions, invalidate]);
  return <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
    <boxGeometry args={size} /><meshStandardMaterial color={color} metalness={.38} roughness={.55} />
  </instancedMesh>;
}

function Module({ position, size, active, children }: {
  position: Point3; size: [number, number]; active: boolean; children: ReactNode;
}) {
  return <group position={[position[0], position[1], position[2]]}>
    <mesh position={[0, -.02, 0]}><boxGeometry args={[size[0], .3, size[1]]} /><meshStandardMaterial color={active ? '#676b70' : '#3d4146'} metalness={.42} roughness={.48} /></mesh>
    <mesh position={[0, .14, 0]}><boxGeometry args={[size[0] - .08, .035, size[1] - .08]} /><meshStandardMaterial color={active ? '#aeb3b6' : '#656b70'} metalness={.18} roughness={.75} /></mesh>
    {active && <mesh position={[0, .16, 0]}><boxGeometry args={[size[0] + .035, .025, size[1] + .035]} /><meshBasicMaterial color="#f4f4f2" wireframe /></mesh>}
    {children}
  </group>;
}

function BitStrip({ value, width = 1.1 }: { value: string | null; width?: number }) {
  const digits = value ?? '?'.repeat(width > 1.4 ? 5 : 4);
  return <group>{[...digits].map((digit, index) => {
    const x = (index - (digits.length - 1) / 2) * (width / digits.length);
    const one = digit === '1';
    return <group key={index} position={[x, .205, 0]}>
      <mesh><boxGeometry args={[width / digits.length - .035, .08, .3]} /><meshStandardMaterial color={one ? '#e8e8e6' : '#17191b'} metalness={.25} roughness={.6} /></mesh>
      <TextLabel text={digit} color={one ? '#111214' : '#eee'} position={[0, .048, 0]} width={width / digits.length - .05} />
    </group>;
  })}</group>;
}

function TraceSegment({ from, to }: { from: Point3; to: Point3 }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dz);
  return <mesh position={[(from[0] + to[0]) / 2, -.31, (from[2] + to[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
    <boxGeometry args={[length, .018, .065]} /><meshBasicMaterial color="#a3a8ad" />
  </mesh>;
}

const edgeContacts: Vec3[] = Array.from({ length: 28 }, (_, index) => [
  -6.1 + (index % 14) * .94,
  -.305,
  index < 14 ? -2.62 : 2.62
]);
const keyboardKeys: Vec3[] = Array.from({ length: 12 }, (_, index) => [
  -.43 + (index % 4) * .28,
  .205,
  -.25 + Math.floor(index / 4) * .25
]);

export function BoardWorld({ state, reducedMotion }: { state: AdditionTraceState; reducedMotion: boolean }) {
  const inputActive = state.activeNode === 'input';
  const [settledStep, setSettledStep] = useState(0);
  const onSignalsSettled = useCallback(() => setSettledStep(state.step), [state.step]);
  return <>
    <color attach="background" args={['#0b0c0e']} />
    <ambientLight intensity={2.3} />
    <directionalLight position={[-4, 9, 7]} intensity={2.5} color="#f2f2ef" />
    <pointLight position={[2, 4, 2]} intensity={11} distance={14} color="#d7dade" />
    <mesh position={[0, -.5, 0]}><boxGeometry args={[13.1, .3, 6]} /><meshStandardMaterial color="#292d31" metalness={.45} roughness={.58} /></mesh>
    <mesh position={[0, -.335, 0]}><boxGeometry args={[12.85, .025, 5.75]} /><meshStandardMaterial color="#32373b" metalness={.28} roughness={.78} /></mesh>
    <InstancedPads positions={edgeContacts} size={[.16, .018, .07]} color="#777b7e" />
    {[[-6.1, -2.58], [6.1, -2.58], [-6.1, 2.58], [6.1, 2.58]].map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, -.29, z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.12, .18, 16]} /><meshBasicMaterial color="#9a9da0" /></mesh>)}

    <TraceSegment from={SCENE_NODES.keyboard} to={SCENE_NODES.buffer} />
    <TraceSegment from={SCENE_NODES.buffer} to={SCENE_NODES.registerA} />
    <TraceSegment from={SCENE_NODES.buffer} to={SCENE_NODES.registerB} />
    <TraceSegment from={SCENE_NODES.registerA} to={SCENE_NODES.alu} />
    <TraceSegment from={SCENE_NODES.registerB} to={SCENE_NODES.alu} />
    <TraceSegment from={SCENE_NODES.alu} to={SCENE_NODES.result} />
    <TraceSegment from={SCENE_NODES.result} to={SCENE_NODES.screen} />

    <Module position={SCENE_NODES.keyboard} size={[1.35, 1.1]} active={inputActive}>
      <InstancedPads positions={keyboardKeys} size={[.22, .075, .18]} color="#787b7e" />
      <TextLabel text="КЛАВИАТУРА" position={[0, .26, .43]} width={1.13} />
    </Module>
    <Module position={SCENE_NODES.buffer} size={[1.55, 1.35]} active={state.activeNode === 'ram-operands' || state.activeNode === 'ram-result'}>
      <group position={[0, 0, -.32]}><BitStrip value={state.memory.aBits} /></group>
      <group position={[0, 0, .05]}><BitStrip value={state.memory.bBits} /></group>
      <group position={[0, 0, .39]}><BitStrip value={state.memory.resultBits} width={1.27} /></group>
      <TextLabel text="RAM / A · B · РЕЗУЛЬТАТ" position={[0, .27, .64]} width={1.5} />
    </Module>
    <Module position={SCENE_NODES.registerA} size={[1.55, .7]} active={state.activeNode === 'registers'}>
      <BitStrip value={state.registers.aBits} />
      <TextLabel text="РЕГИСТР A" position={[0, .27, .29]} width={1.05} />
    </Module>
    <Module position={SCENE_NODES.registerB} size={[1.55, .7]} active={state.activeNode === 'registers'}>
      <BitStrip value={state.registers.bBits} />
      <TextLabel text="РЕГИСТР B" position={[0, .27, .29]} width={1.05} />
    </Module>

    <mesh position={[1.03, -.17, 0]}><boxGeometry args={[3.2, .17, 1.95]} /><meshStandardMaterial color="#50565a" metalness={.33} roughness={.62} /></mesh>
    <TextLabel text="ALU / ЧЕТЫРЕ ПОЛНЫХ СУММАТОРА" position={[1.03, .025, -.79]} width={2.85} />
    {[3, 2, 1, 0].map((bit) => {
      const position = adderPosition(bit);
      return <Module key={bit} position={position} size={[.58, 1.15]} active={state.activeBit === bit}>
        <TextLabel text={`FA${bit}`} position={[0, .32, -.52]} width={.39} />
        {([
          ['A', state.registers.aBits?.[3 - bit] ?? '?', -.27],
          ['B', state.registers.bBits?.[3 - bit] ?? '?', .04],
          ['Σ', state.table.sum[bit] === null ? '?' : String(state.table.sum[bit]), .35]
        ] as const).map(([label, value, z]) => <group key={label}>
          <TextLabel text={label} position={[-.18, .3, z]} width={.16} />
          <group position={[.07, .05, z]}><BitStrip value={value} width={.23} /></group>
        </group>)}
        {[-.27, .04, .35].map((z) => <mesh key={z} position={[-.29, .2, z]}><cylinderGeometry args={[.028, .028, .08, 8]} /><meshStandardMaterial color="#c3c5c6" metalness={.8} roughness={.25} /></mesh>)}
      </Module>;
    })}

    {state.activeBit !== null && state.carryIn !== null && <CarryMarker value={state.carryIn} position={[adderPosition(state.activeBit)[0] + .3, .52, .55]} />}
    {state.activeBit !== null && state.carryOut !== null && <CarryMarker value={state.carryOut} position={[adderPosition(state.activeBit)[0] - .3, .52, .55]} />}

    <Module position={SCENE_NODES.result} size={[1.78, .82]} active={state.activeNode === 'result-register'}>
      <BitStrip value={state.step === 8 && settledStep !== 8 ? null : state.registers.resultBits} width={1.47} />
      <TextLabel text="РЕГИСТР РЕЗУЛЬТАТА / 5 БИТ" position={[0, .27, .34]} width={1.7} />
    </Module>
    <group position={[SCENE_NODES.screen[0], 0, SCENE_NODES.screen[2]]}>
      <mesh position={[0, .42, -.08]}><boxGeometry args={[1.42, 1.2, .2]} /><meshStandardMaterial color={state.activeNode === 'screen' ? '#66696b' : '#343639'} metalness={.45} roughness={.55} /></mesh>
      <mesh position={[0, .43, .025]}><planeGeometry args={[1.24, .96]} /><meshBasicMaterial color="#111315" /></mesh>
      {state.screenValue !== null && <TextLabel text={String(state.screenValue)} position={[0, .45, .038]} width={.9} vertical compact />}
      <TextLabel text="ЭКРАН" position={[0, -.01, .45]} width={.95} />
    </group>
    <TextLabel text="ЛОГИЧЕСКАЯ МОДЕЛЬ, НЕ ДОРОЖКИ ПЛАТЫ" position={[-.6, -.29, 2.8]} width={4.1} color="#a9adb0" />
    {settledStep !== state.step && <SignalActors key={state.step} signals={state.signals} reducedMotion={reducedMotion} onSettled={onSignalsSettled} />}
  </>;
}
