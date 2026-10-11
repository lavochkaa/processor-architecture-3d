import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { CPU_FOOTPRINT } from './sceneLayout';
import { lidOpenForStep } from './lidState';
import { TextLabel } from './TextLabel';

export function CpuLid({ step, speed, reducedMotion }: { step: number | null; speed: number; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const { invalidate } = useThree();
  const openness = useRef(lidOpenForStep(step));
  const transition = useRef({ from: openness.current, to: openness.current, startedAt: 0, duration: 1 });
  const width = CPU_FOOTPRINT.maxX - CPU_FOOTPRINT.minX - .28;
  const depth = CPU_FOOTPRINT.maxZ - CPU_FOOTPRINT.minZ - .2;

  useEffect(() => {
    const to = lidOpenForStep(step);
    if (reducedMotion) {
      openness.current = to;
      if (group.current) {
        group.current.position.y = .37 + .45 * to;
        group.current.position.z = -3.4 * to;
        group.current.rotation.x = -.22 * to;
      }
    } else {
      transition.current = { from: openness.current, to, startedAt: performance.now(), duration: 1.12 / speed };
    }
    invalidate();
  }, [step, speed, reducedMotion, invalidate]);

  useFrame(() => {
    if (reducedMotion) return;
    const { from, to, startedAt, duration } = transition.current;
    if (!group.current || Math.abs(openness.current - to) < .001) return;
    const phase = Math.min(1, (performance.now() - startedAt) / (duration * 1000));
    const eased = phase * phase * (3 - 2 * phase);
    openness.current = from + (to - from) * eased;
    group.current.position.y = .37 + .45 * openness.current;
    group.current.position.z = -3.4 * openness.current;
    group.current.rotation.x = -.22 * openness.current;
    if (phase < 1) invalidate();
  });

  return <group ref={group} position={[(CPU_FOOTPRINT.minX + CPU_FOOTPRINT.maxX) / 2, .37 + .45 * openness.current, -3.4 * openness.current]} rotation={[-.22 * openness.current, 0, 0]}>
      <mesh position={[0, .035, 0]}><boxGeometry args={[width, .1, depth]} /><meshStandardMaterial color="#a7adaf" metalness={.62} roughness={.38} side={2} /></mesh>
      <mesh position={[0, .094, 0]}><boxGeometry args={[width - .17, .015, depth - .17]} /><meshStandardMaterial color="#51575a" metalness={.55} roughness={.46} side={2} /></mesh>
      <TextLabel text="CPU / ПРОЦЕССОР" color="#f3f4f3" position={[0, .115, 0]} width={3.45} />
  </group>;
}
