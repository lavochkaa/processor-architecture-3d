import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Vector3 } from 'three';

type Point = readonly [number, number, number];

export function CameraRig({ position, target, resetToken, reducedMotion }: { position: Point; target: Point; resetToken: number; reducedMotion: boolean }) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const destination = useRef({ position: new Vector3(...position), target: new Vector3(...target) });
  const moving = useRef(false);

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableDamping = false;
    orbit.minDistance = 3;
    orbit.maxDistance = 13;
    orbit.maxPolarAngle = Math.PI * 0.72;
    const onChange = () => invalidate();
    const onStart = () => { moving.current = false; };
    orbit.addEventListener('change', onChange);
    orbit.addEventListener('start', onStart);
    controls.current = orbit;
    return () => {
      orbit.removeEventListener('change', onChange);
      orbit.removeEventListener('start', onStart);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    destination.current = { position: new Vector3(...position), target: new Vector3(...target) };
    if (reducedMotion) {
      camera.position.copy(destination.current.position);
      controls.current?.target.copy(destination.current.target);
      controls.current?.update();
      moving.current = false;
    } else {
      moving.current = true;
    }
    invalidate();
  }, [position, target, resetToken, reducedMotion, camera, invalidate]);

  useFrame((_, delta) => {
    if (!moving.current || !controls.current) return;
    const easing = 1 - Math.exp(-Math.min(delta, 0.05) * 5);
    camera.position.lerp(destination.current.position, easing);
    controls.current.target.lerp(destination.current.target, easing);
    controls.current.update();
    const close = camera.position.distanceToSquared(destination.current.position) < 0.0003
      && controls.current.target.distanceToSquared(destination.current.target) < 0.0003;
    if (close) {
      camera.position.copy(destination.current.position);
      controls.current.target.copy(destination.current.target);
      controls.current.update();
      moving.current = false;
    } else invalidate();
  });
  return null;
}
