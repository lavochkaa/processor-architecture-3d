import { describe, expect, it } from 'vitest';
import { buildTrace } from '../../domain/arithmetic/buildTrace';
import { computeAddition } from '../../domain/arithmetic/computeAddition';
import { CHAPTER_LABELS, copyForStep, formatAnnouncement } from './copy';

describe('ten-step explanation copy', () => {
  const trace = buildTrace(computeAddition(11, 6));

  it('names RAM and CPU transfer stages without claiming a literal circuit route', () => {
    expect(copyForStep(trace[1]).explanation).toMatch(/RAM/);
    expect(copyForStep(trace[2]).explanation).toMatch(/регистры/);
    expect(copyForStep(trace[8]).explanation).toMatch(/RAM/);
    expect(copyForStep(trace[9]).explanation).toMatch(/10001₂.*17₁₀/);
  });

  it('announces the tenth step and memory chapter', () => {
    expect(CHAPTER_LABELS.memory).toBe('Память и регистры');
    expect(formatAnnouncement({ kind: 'step', step: 10 }, trace)).toMatch(/^Шаг 10 из 10\./);
    expect(formatAnnouncement({ kind: 'chapter', chapter: 'memory', step: 3 }, trace)).toBe('Глава Память и регистры. Шаг 3 из 10.');
  });
});
