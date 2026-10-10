import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Scenario } from '../../content/scenarios/schema';

type Cue = Scenario['steps'][number]['visualCue'];

const anchors: [number, number, number][] = [
  [-4.3, 3.1, 6.6], [-2.5, 3.2, 6.3], [0.2, 4.0, 6.7], [2.2, 4.1, 6.5], [3.0, 4.2, 7.0], [4.3, 3.2, 6.5]
];

const positions: Record<Cue['node'], [number, number, number]> = {
  keyboard: [-3.4, -0.8, 0.3], usb: [-1.7, -0.45, 0.2], os: [-0.5, 0.05, 0], focus: [1.4, 1.0, 0],
  browser: [2.5, 1.0, 0], cpu: [0.0, 0.2, 0], render: [1.25, -0.1, 0], display: [3.35, 0.7, 0]
};

function CameraControls({ anchor, resetToken }: { anchor: number; resetToken: number }) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableDamping = false;
    orbit.minDistance = 3;
    orbit.maxDistance = 12;
    orbit.maxPolarAngle = Math.PI * 0.68;
    const handleChange = () => invalidate();
    orbit.addEventListener('change', handleChange);
    controls.current = orbit;
    return () => { orbit.removeEventListener('change', handleChange); orbit.dispose(); controls.current = null; };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    const position = anchors[anchor] ?? anchors[0];
    camera.position.set(...position);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [anchor, resetToken, camera, invalidate]);
  return null;
}

function World({ cue }: { cue: Cue }) {
  const activePosition = positions[cue.node];
  const color = { input: '#59e0d0', event: '#b999ff', state: '#ffc36e', frame: '#a7df8a' }[cue.signalType];
  return <>
    <ambientLight intensity={1.5} />
    <directionalLight position={[2, 6, 5]} intensity={2} />
    <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 5]} /><meshStandardMaterial color="#11242d" /></mesh>
    <mesh position={positions.keyboard}><boxGeometry args={[1.55, 0.2, 0.85]} /><meshStandardMaterial color={cue.node === 'keyboard' ? '#59e0d0' : '#456273'} metalness={0.35} /></mesh>
    <mesh position={positions.usb} rotation={[0, 0, -0.1]}><boxGeometry args={[1.1, 0.08, 0.08]} /><meshStandardMaterial color={cue.node === 'usb' ? '#59e0d0' : '#6e8892'} /></mesh>
    <mesh position={[-0.2, -0.45, 0]}><boxGeometry args={[2.6, 0.14, 2.0]} /><meshStandardMaterial color="#264839" metalness={0.4} /></mesh>
    <mesh position={[-1.1, -0.22, 0.45]}><boxGeometry args={[0.32, 0.18, 0.32]} /><meshStandardMaterial color={cue.node === 'os' ? '#b999ff' : '#619fa0'} /></mesh>
    <mesh position={positions.cpu}><boxGeometry args={[0.7, 0.28, 0.7]} /><meshStandardMaterial color={cue.node === 'cpu' ? '#ffc36e' : '#a4b8b3'} metalness={0.7} /></mesh>
    <mesh position={[0.75, -0.08, -0.55]}><boxGeometry args={[0.25, 0.18, 0.85]} /><meshStandardMaterial color="#67a9aa" /></mesh>
    <mesh position={[0.98, -0.08, 0.58]}><boxGeometry args={[0.45, 0.16, 0.42]} /><meshStandardMaterial color={cue.node === 'render' ? '#a7df8a' : '#728e79'} /></mesh>
    <mesh position={positions.display}><boxGeometry args={[1.5, 1.15, 0.09]} /><meshStandardMaterial color={cue.node === 'display' ? '#a7df8a' : '#557784'} emissive={cue.node === 'display' ? '#36542d' : '#000000'} /></mesh>
    <mesh position={[3.35, -0.05, 0]}><boxGeometry args={[0.12, 0.48, 0.12]} /><meshStandardMaterial color="#728e91" /></mesh>
    <mesh position={[3.35, -0.34, 0]}><boxGeometry args={[0.8, 0.07, 0.5]} /><meshStandardMaterial color="#728e91" /></mesh>
    <mesh position={[activePosition[0], activePosition[1] + 0.52, activePosition[2]]}>
      {cue.signalType === 'input' && <cylinderGeometry args={[0.16, 0.16, 0.12, 6]} />}
      {cue.signalType === 'event' && <boxGeometry args={[0.28, 0.22, 0.08]} />}
      {cue.signalType === 'state' && <sphereGeometry args={[0.15, 12, 8]} />}
      {cue.signalType === 'frame' && <planeGeometry args={[0.36, 0.24]} />}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
    </mesh>
  </>;
}

export default function Scene3D({ cue, resetToken, onContextLost }: { cue: Cue; resetToken: number; onContextLost: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const handleLost = (event: Event) => { event.preventDefault(); onContextLost(); };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [onContextLost]);
  return <div className="scene-3d" ref={canvasRef} data-testid="scene-3d" aria-hidden="true">
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: anchors[0], fov: 42 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <World cue={cue} />
      <CameraControls anchor={cue.cameraAnchor} resetToken={resetToken} />
    </Canvas>
  </div>;
}
