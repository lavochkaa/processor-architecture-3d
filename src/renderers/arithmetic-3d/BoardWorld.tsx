import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { Object3D, type InstancedMesh } from 'three';
import type { AdditionTraceState, TraceSignal } from '../../domain/arithmetic/buildTrace';
import type { KeypadKey } from '../../components/arithmetic/keypadInput';
import { adderPosition, CPU_FOOTPRINT, SCENE_NODES, type Point3 } from './sceneLayout';
import { TextLabel } from './TextLabel';
import { CarryMarker, SignalActors } from './SignalActors';
import { isDirectJump, motionForTransition, type TransitionMotion } from './motionState';
import { routeForSignal } from './signalPaths';
import { CpuLid } from './CpuLid';

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
const keyboardKeys: readonly KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A/B', '0', '⌫'];
const cpuPins: Vec3[] = [
  ...Array.from({ length: 22 }, (_, index): Vec3 => [CPU_FOOTPRINT.minX + .25 + index * .31, -.18, CPU_FOOTPRINT.minZ - .07]),
  ...Array.from({ length: 22 }, (_, index): Vec3 => [CPU_FOOTPRINT.minX + .25 + index * .31, -.18, CPU_FOOTPRINT.maxZ + .07]),
  ...Array.from({ length: 8 }, (_, index): Vec3 => [CPU_FOOTPRINT.minX - .07, -.18, CPU_FOOTPRINT.minZ + .25 + index * .36]),
  ...Array.from({ length: 8 }, (_, index): Vec3 => [CPU_FOOTPRINT.maxX + .07, -.18, CPU_FOOTPRINT.minZ + .25 + index * .36])
];
const ramContacts: Vec3[] = Array.from({ length: 12 }, (_, index): Vec3 => [-.67 + index * .12, .205, .67]);
const ramChips: Vec3[] = [-.49, -.16, .16, .49].map((x): Vec3 => [x, .245, -.53]);
const NO_SIGNALS: readonly TraceSignal[] = Object.freeze([]);

type VisualState = { target: AdditionTraceState | null; shown: AdditionTraceState | null; motion: TransitionMotion | null; jump: boolean };

export function BoardWorld({ state, speed, reducedMotion, selectedInput, pressedKey, onKeyPress, onSettled, onInspectSsd }: {
  state: AdditionTraceState | null; speed: number; reducedMotion: boolean; selectedInput: 'a' | 'b';
  pressedKey: KeypadKey | null; onKeyPress: (key: KeypadKey) => void;
  onSettled?: (state: AdditionTraceState) => void;
  onInspectSsd: () => void;
}) {
  const { gl } = useThree();
  const inputActive = !state || state.activeNode === 'input';
  const [visual, setVisual] = useState<VisualState>({ target: state, shown: state, motion: null, jump: false });
  useEffect(() => {
    setVisual((current) => {
      if (current.target === state && !reducedMotion) return current;
      const motion = motionForTransition(current.shown, state);
      const jump = isDirectJump(current.shown, state);
      return reducedMotion || (motion.signals.length === 0 && !jump)
        ? { target: state, shown: state, motion: null, jump: false }
        : { target: state, shown: current.shown, motion: motion.signals.length ? motion : null, jump };
    });
  }, [state, reducedMotion]);
  useEffect(() => {
    if (!visual.jump || !state || visual.target !== state) return;
    const timer = window.setTimeout(() => {
      setVisual((current) => current.target === state ? { target: state, shown: state, motion: null, jump: false } : current);
    }, 1120 / speed);
    return () => window.clearTimeout(timer);
  }, [state, speed, visual.jump, visual.target]);
  useEffect(() => {
    if (state && visual.target === state && visual.shown === state && !visual.motion && !visual.jump) onSettled?.(state);
  }, [state, visual, onSettled]);
  const onSignalsSettled = useCallback(() => {
    setVisual((current) => current.target === state ? { ...current, shown: state, motion: null, jump: false } : current);
    if (state) onSettled?.(state);
  }, [state, onSettled]);
  const shown = visual.shown;
  // During rewind the landing glyph becomes the departing glyph. Keep its
  // permanent copy hidden until the earlier trace state takes over.
  const reversingFrom = new Set(visual.motion?.reverse ? visual.motion.signals.map((signal) => signal.to) : []);
  const rearRoute = routeForSignal({ shape: 'packet', from: 'result-register', to: 'ram-result', bitIndex: null, value: null, label: 'Σ', bits: '00000' });
  const screenRoute = routeForSignal({ shape: 'packet', from: 'ram-result', to: 'screen', bitIndex: null, value: null, label: 'Σ', bits: '00000' });
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
    {rearRoute.slice(1).map((point, index) => <TraceSegment key={`write-${index}`} from={rearRoute[index]} to={point} />)}
    {screenRoute.slice(1).map((point, index) => <TraceSegment key={`display-${index}`} from={screenRoute[index]} to={point} />)}

    <group aria-label="Корпус процессора">
      <mesh position={[(CPU_FOOTPRINT.minX + CPU_FOOTPRINT.maxX) / 2, -.205, 0]}><boxGeometry args={[CPU_FOOTPRINT.maxX - CPU_FOOTPRINT.minX, .21, CPU_FOOTPRINT.maxZ - CPU_FOOTPRINT.minZ]} /><meshStandardMaterial color="#6a6e70" metalness={.55} roughness={.42} /></mesh>
      <mesh position={[(CPU_FOOTPRINT.minX + CPU_FOOTPRINT.maxX) / 2, -.085, 0]}><boxGeometry args={[CPU_FOOTPRINT.maxX - CPU_FOOTPRINT.minX - .24, .035, CPU_FOOTPRINT.maxZ - CPU_FOOTPRINT.minZ - .24]} /><meshStandardMaterial color="#262a2d" metalness={.32} roughness={.65} /></mesh>
      <InstancedPads positions={cpuPins} size={[.095, .11, .085]} color="#b8bec0" />
      {[CPU_FOOTPRINT.minZ, CPU_FOOTPRINT.maxZ].map((z) => <mesh key={z} position={[(CPU_FOOTPRINT.minX + CPU_FOOTPRINT.maxX) / 2, .15, z]}><boxGeometry args={[CPU_FOOTPRINT.maxX - CPU_FOOTPRINT.minX, .2, .13]} /><meshStandardMaterial color="#8b9193" metalness={.6} roughness={.35} /></mesh>)}
      {[CPU_FOOTPRINT.minX, CPU_FOOTPRINT.maxX].map((x) => <mesh key={x} position={[x, .15, 0]}><boxGeometry args={[.13, .2, CPU_FOOTPRINT.maxZ - CPU_FOOTPRINT.minZ]} /><meshStandardMaterial color="#8b9193" metalness={.6} roughness={.35} /></mesh>)}
      <TextLabel text="CPU / ПРОЦЕССОР" position={[.95, .28, CPU_FOOTPRINT.minZ]} width={2.7} />
      <TextLabel text="РЕГИСТРЫ  →  ALU  →  РЕЗУЛЬТАТ" position={[.95, -.015, CPU_FOOTPRINT.maxZ - .09]} width={4.8} color="#bfc4c5" />
    </group>
    <CpuLid step={state?.step ?? null} speed={speed} reducedMotion={reducedMotion} />

    <Module position={SCENE_NODES.keyboard} size={[1.78, 1.52]} active={inputActive}>
      {keyboardKeys.map((key, index) => <group key={key} position={[-.49 + (index % 3) * .49, pressedKey === key ? -.045 : .025, -.48 + Math.floor(index / 3) * .31]} onPointerOver={() => { gl.domElement.style.cursor = state ? '' : 'pointer'; }} onPointerOut={() => { gl.domElement.style.cursor = ''; }} onClick={(event) => { event.stopPropagation(); onKeyPress(key); }}>
        <mesh position={[0, .22, 0]}><boxGeometry args={[.42, .1, .26]} /><meshStandardMaterial color={pressedKey === key ? '#d4d7d7' : '#858b8e'} metalness={.25} roughness={.6} /></mesh>
        <TextLabel text={key} color="#101214" position={[0, .278, 0]} width={key === 'A/B' ? .34 : .28} compact />
      </group>)}
      <TextLabel text={`КЛАВИАТУРА / ${selectedInput.toUpperCase()}`} position={[0, .3, .68]} width={1.58} />
    </Module>
    <Module position={SCENE_NODES.buffer} size={[1.55, 1.35]} active={state?.activeNode === 'ram-operands' || state?.activeNode === 'ram-result'}>
      <InstancedPads positions={ramContacts} size={[.075, .02, .16]} color="#c4c6c2" />
      <InstancedPads positions={ramChips} size={[.23, .09, .19]} color="#151719" />
      {[-.32, .05, .39].map((z) => <mesh key={z} position={[0, .165, z]}><boxGeometry args={[1.28, .018, .32]} /><meshStandardMaterial color="#889094" metalness={.65} roughness={.35} /></mesh>)}
      <group position={[0, 0, -.32]}><BitStrip value={reversingFrom.has('ram-a') ? null : shown?.memory.aBits ?? null} /></group>
      <group position={[0, 0, .05]}><BitStrip value={reversingFrom.has('ram-b') ? null : shown?.memory.bBits ?? null} /></group>
      <group position={[0, 0, .39]}><BitStrip value={reversingFrom.has('ram-result') ? null : shown?.memory.resultBits ?? null} width={1.27} /></group>
      {([['A', -.32], ['B', .05], ['Σ', .39]] as const).map(([label, z]) => <TextLabel key={label} text={label} position={[.66, .27, z]} width={.16} />)}
      <TextLabel text="RAM / A · B · РЕЗУЛЬТАТ" position={[0, .27, .64]} width={1.5} />
    </Module>
    <group onClick={(event) => { event.stopPropagation(); onInspectSsd(); }}>
    <Module position={SCENE_NODES.ssd} size={[1.48, .75]} active={false}>
      <InstancedPads positions={[[-.38, .22, -.05], [0, .22, -.05], [.38, .22, -.05]]} size={[.28, .08, .33]} color="#17191b" />
      <mesh position={[.61, .21, -.27]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.05, .09, 16]} /><meshStandardMaterial color="#b6bbbc" metalness={.8} roughness={.3} side={2} /></mesh>
      <TextLabel text="SSD / НЕ УЧАСТВУЕТ" position={[0, .29, .31]} width={1.35} />
    </Module>
    </group>
    <Module position={SCENE_NODES.registerA} size={[1.55, .7]} active={state?.activeNode === 'registers'}>
      <mesh position={[-.71, .21, 0]}><cylinderGeometry args={[.06, .06, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[.71, .21, 0]}><cylinderGeometry args={[.06, .06, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <BitStrip value={reversingFrom.has('register-a') ? null : shown?.registers.aBits ?? null} />
      <TextLabel text="РЕГИСТР A" position={[0, .27, .29]} width={1.05} />
    </Module>
    <Module position={SCENE_NODES.registerB} size={[1.55, .7]} active={state?.activeNode === 'registers'}>
      <mesh position={[-.71, .21, 0]}><cylinderGeometry args={[.06, .06, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[.71, .21, 0]}><cylinderGeometry args={[.06, .06, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <BitStrip value={reversingFrom.has('register-b') ? null : shown?.registers.bBits ?? null} />
      <TextLabel text="РЕГИСТР B" position={[0, .27, .29]} width={1.05} />
    </Module>

    <mesh position={[1.03, -.17, 0]}><boxGeometry args={[3.2, .17, 1.95]} /><meshStandardMaterial color="#50565a" metalness={.33} roughness={.62} /></mesh>
    <TextLabel text="ALU / ЧЕТЫРЕ ПОЛНЫХ СУММАТОРА" position={[1.03, .025, -.79]} width={2.85} />
    {[3, 2, 1, 0].map((bit) => {
      const position = adderPosition(bit);
      return <Module key={bit} position={position} size={[.58, 1.15]} active={state?.activeBit === bit}>
        <TextLabel text={`FA${bit}`} position={[0, .32, -.52]} width={.39} />
        {([
          ['A', shown && shown.step >= bit + 4 && !reversingFrom.has(`adder-${bit}`) ? shown.registers.aBits?.[3 - bit] ?? '?' : '?', -.27],
          ['B', shown && shown.step >= bit + 4 && !reversingFrom.has(`adder-${bit}`) ? shown.registers.bBits?.[3 - bit] ?? '?' : '?', .04],
          ['Σ', shown?.table.sum[bit] == null ? '?' : String(shown.table.sum[bit]), .35]
        ] as const).map(([label, value, z]) => <group key={label}>
          <TextLabel text={label} position={[-.18, .3, z]} width={.16} />
          <group position={[.07, .05, z]}><BitStrip value={value} width={.23} /></group>
        </group>)}
        {[-.27, .04, .35].map((z) => <mesh key={z} position={[-.29, .2, z]}><cylinderGeometry args={[.028, .028, .08, 8]} /><meshStandardMaterial color="#c3c5c6" metalness={.8} roughness={.25} /></mesh>)}
        <TextLabel text={`c${bit}`} position={[.18, .28, .54]} width={.2} compact />
        <TextLabel text={`c${bit + 1}`} position={[-.19, .28, .54]} width={.22} compact />
        <mesh position={[.25, .19, .55]}><cylinderGeometry args={[.038, .038, .12, 10]} /><meshStandardMaterial color="#cfd4d5" metalness={.8} roughness={.27} /></mesh>
        <mesh position={[-.25, .19, .55]}><cylinderGeometry args={[.038, .038, .12, 10]} /><meshStandardMaterial color="#cfd4d5" metalness={.8} roughness={.27} /></mesh>
      </Module>;
    })}

    {shown?.table.carry.map((value, index) => value === null || (index > 0 && reversingFrom.has(index === 4 ? 'carry-out' : `adder-${index}`)) ? null :
      <CarryMarker key={index} value={value} label={`c${index}`} position={index === 4 ? [-.45, .53, 0] : [adderPosition(index)[0] + .29, .53, .55]} />)}

    <Module position={SCENE_NODES.result} size={[1.78, .82]} active={state?.activeNode === 'result-register'}>
      <mesh position={[-.8, .21, 0]}><cylinderGeometry args={[.065, .065, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[.8, .21, 0]}><cylinderGeometry args={[.065, .065, .11, 12]} /><meshStandardMaterial color="#d2d6d7" metalness={.75} roughness={.25} /></mesh>
      <BitStrip value={reversingFrom.has('result-register') ? null : shown?.registers.resultBits ?? null} width={1.47} />
      <TextLabel text="РЕГИСТР РЕЗУЛЬТАТА / 5 БИТ" position={[0, .27, .34]} width={1.7} />
    </Module>
    <group position={[SCENE_NODES.screen[0], 0, SCENE_NODES.screen[2]]}>
      <mesh position={[0, -.24, -.16]}><boxGeometry args={[.56, .09, .53]} /><meshStandardMaterial color="#838a8d" metalness={.57} roughness={.42} /></mesh>
      <mesh position={[0, -.07, -.11]}><boxGeometry args={[.1, .35, .12]} /><meshStandardMaterial color="#838a8d" metalness={.57} roughness={.42} /></mesh>
      <mesh position={[0, .42, -.08]}><boxGeometry args={[1.42, 1.2, .2]} /><meshStandardMaterial color={state?.activeNode === 'screen' ? '#66696b' : '#343639'} metalness={.45} roughness={.55} /></mesh>
      <mesh position={[0, .43, .025]}><planeGeometry args={[1.24, .96]} /><meshBasicMaterial color="#111315" /></mesh>
      {shown?.screenValue != null && !reversingFrom.has('screen') && <TextLabel text={String(shown.screenValue)} position={[0, .45, .038]} width={.9} vertical compact />}
      <TextLabel text="ЭКРАН" position={[0, -.01, .45]} width={.95} />
    </group>
    <TextLabel text="ЛОГИЧЕСКАЯ МОДЕЛЬ, НЕ ДОРОЖКИ ПЛАТЫ" position={[-.6, -.29, 2.8]} width={4.1} color="#a9adb0" />
    <SignalActors signals={visual.motion?.signals ?? NO_SIGNALS} reverse={visual.motion?.reverse ?? false} speed={speed} reducedMotion={reducedMotion} onSettled={onSignalsSettled} />
  </>;
}
