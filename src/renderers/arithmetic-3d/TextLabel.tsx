import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

type Vec3 = [number, number, number];

export function TextLabel({ text, position, width = 1, color = '#f1f1ef', vertical = false, compact = false, opacity = 1 }: {
  text: string; position: Vec3; width?: number; color?: string; vertical?: boolean; compact?: boolean; opacity?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = compact ? 256 : 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Text canvas unavailable');
    let size = compact ? 104 : 62;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    do {
      context.font = `700 ${size}px Arial, sans-serif`;
      size -= 2;
    } while (context.measureText(text).width > canvas.width - 54 && size > 24);
    context.fillText(text, canvas.width / 2, 64);
    const value = new CanvasTexture(canvas);
    value.colorSpace = SRGBColorSpace;
    return value;
  }, [text, color, compact]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={vertical ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[width, width * (compact ? .5 : .125)]} />
    <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
  </mesh>;
}
