import type { Bit } from '../../domain/arithmetic/computeAddition';

export function BitCell({ value, label, active = false }: { value: Bit | null; label: string; active?: boolean }) {
  return <span
    className={`compute-bit ${value === 1 ? 'is-one' : value === 0 ? 'is-zero' : 'is-unknown'}${active ? ' is-active' : ''}`}
    aria-label={`${label}: ${value === null ? 'ещё неизвестно' : value}`}
  >{value === null ? '?' : value}</span>;
}
