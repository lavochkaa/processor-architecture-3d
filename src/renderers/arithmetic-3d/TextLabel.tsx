import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

type Vec3 = [number, number, number];

export function TextLabel({ text, position, width = 1, color = '#f1f1ef', vertical = false }: {
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
