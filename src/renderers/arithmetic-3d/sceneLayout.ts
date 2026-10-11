export type Point3 = readonly [number, number, number];

export const SCENE_NODES = {
  keyboard: [-5.35, 0, 0] as Point3,
  buffer: [-3.45, 0, 0] as Point3,
  registerA: [-1.55, 0, -1.05] as Point3,
  registerB: [-1.55, 0, 1.05] as Point3,
  alu: [1.02, 0, 0] as Point3,
  result: [3.75, 0, 0] as Point3,
  ssd: [-3.55, 0, 2.12] as Point3,
  screen: [5.52, 0, 0] as Point3
} as const;

export const CPU_FOOTPRINT = { minX: -2.5, maxX: 4.48, minZ: -1.55, maxZ: 1.55 } as const;

/** Bit 0 is at the right edge, so a carry toward bit i+1 travels left. */
export function adderPosition(bit: number): Point3 {
  if (!Number.isInteger(bit) || bit < 0 || bit > 3) throw new RangeError('Adder bit must be 0–3');
  return [2.04 - bit * 0.68, 0.02, 0];
}
