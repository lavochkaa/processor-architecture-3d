import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, Object3D, SRGBColorSpace, type InstancedMesh } from 'three';
import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import { adderPosition, SCENE_NODES, type Point3 } from './sceneLayout';

type Vec3 = [number, number, number];

function TextLabel({ text, position, width = 1, color = '#f1f1ef', vertical = false }: {
  text: string; position: Vec3; width?: number; color?: string; vertical?: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Text canvas unavailable');
    let size = 62;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    do {
      context.font = `700 ${size}px Arial, sans-serif`;
      size -= 2;
    } while (context.measureText(text).width > 970 && size > 24);
    context.fillText(text, 512, 64);
    const value = new CanvasTexture(canvas);
    value.colorSpace = SRGBColorSpace;
    return value;
  }, [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={vertical ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[width, width * .125]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} />
  </mesh>;
}

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

export function BoardWorld({ state }: { state: AdditionTraceState }) {
  const inputActive = state.activeNode === 'input';
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
    <Module position={SCENE_NODES.buffer} size={[1.55, 1.35]} active={state.activeNode === 'buffer'}>
      <group position={[0, 0, -.25]}><BitStrip value={state.buffer?.aBits ?? null} /></group>
      <group position={[0, 0, .25]}><BitStrip value={state.buffer?.bBits ?? null} /></group>
      <TextLabel text="БУФЕР ВВОДА (УСЛОВНЫЙ)" position={[0, .27, .57]} width={1.5} />
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
        <TextLabel text={`FA${bit}`} position={[0, .29, -.28]} width={.48} />
        <group position={[0, .05, .2]}><BitStrip value={state.table.sum[bit] === null ? '?' : String(state.table.sum[bit])} width={.25} /></group>
        {[-.38, 0, .38].map((z) => <mesh key={z} position={[-.22, .2, z]}><cylinderGeometry args={[.035, .035, .08, 8]} /><meshStandardMaterial color="#c3c5c6" metalness={.8} roughness={.25} /></mesh>)}
      </Module>;
    })}

    <Module position={SCENE_NODES.result} size={[1.78, .82]} active={state.activeNode === 'result-register'}>
      <BitStrip value={state.registers.resultBits} width={1.47} />
      <TextLabel text="РЕГИСТР РЕЗУЛЬТАТА / 5 БИТ" position={[0, .27, .34]} width={1.7} />
    </Module>
    <group position={[SCENE_NODES.screen[0], 0, SCENE_NODES.screen[2]]}>
      <mesh position={[0, .42, -.08]}><boxGeometry args={[1.42, 1.2, .2]} /><meshStandardMaterial color={state.activeNode === 'screen' ? '#66696b' : '#343639'} metalness={.45} roughness={.55} /></mesh>
      <mesh position={[0, .43, .025]}><planeGeometry args={[1.24, .96]} /><meshBasicMaterial color="#111315" /></mesh>
      <TextLabel text={state.screenValue === null ? '—' : String(state.screenValue)} position={[0, .45, .035]} width={.9} vertical />
      <TextLabel text="ЭКРАН" position={[0, -.01, .45]} width={.95} />
    </group>
    <TextLabel text="ЛОГИЧЕСКАЯ МОДЕЛЬ, НЕ ДОРОЖКИ ПЛАТЫ" position={[-.6, -.29, 2.8]} width={4.1} color="#a9adb0" />
  </>;
}
