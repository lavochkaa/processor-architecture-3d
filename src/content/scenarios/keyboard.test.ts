import { describe, expect, it } from 'vitest';
import { keyboardScenario, parseScenario } from './keyboard';

describe('keyboard scenario content', () => {
  it('contains eight ordered, sourced steps and four questions', () => {
    expect(keyboardScenario.steps).toHaveLength(8);
    expect(keyboardScenario.assessment).toHaveLength(4);
    expect(keyboardScenario.steps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const step of keyboardScenario.steps) {
      expect(step.sourceRefs.length).toBeGreaterThan(0);
      expect(step.accessibilityNarration.length).toBeGreaterThan(0);
      expect(step.omissions.length).toBeGreaterThan(0);
      expect(step.prohibitedClaims.length).toBeGreaterThan(0);
    }
  });

  it('rejects missing educational content', () => {
    const damaged = structuredClone(keyboardScenario);
    damaged.steps[0].explanation.basic = '';
    expect(() => parseScenario(damaged)).toThrow();
  });

  it('rejects broken ordering, source references and answer keys', () => {
    const unordered = structuredClone(keyboardScenario);
    unordered.steps[1].order = 9;
    expect(() => parseScenario(unordered)).toThrow();
    const unsourced = structuredClone(keyboardScenario);
    unsourced.steps[0].sourceRefs = ['unknown'];
    expect(() => parseScenario(unsourced)).toThrow();
    const unanswerable = structuredClone(keyboardScenario);
    unanswerable.assessment[0].correctOptionId = 'unknown';
    expect(() => parseScenario(unanswerable)).toThrow();
  });
});
