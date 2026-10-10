import { describe, expect, it } from 'vitest';
import { initialScenarioState, scenarioReducer } from './scenario';

describe('scenario reducer', () => {
  it('starts at introduction and advances through exactly eight steps', () => {
    let state = scenarioReducer(initialScenarioState, { type: 'START' });
    expect(state.phase).toBe('step');
    expect(state.stepIndex).toBe(0);
    for (let index = 0; index < 8; index += 1) {
      state = scenarioReducer(state, { type: 'NEXT' });
    }
    expect(state.phase).toBe('completed');
    expect(state.stepIndex).toBe(7);
  });

  it('changes detail and render mode without resetting progress', () => {
    const started = scenarioReducer(initialScenarioState, { type: 'START' });
    const second = scenarioReducer(started, { type: 'NEXT' });
    const detailed = scenarioReducer(second, { type: 'SET_DETAIL', detail: 'expert' });
    const schematic = scenarioReducer(detailed, { type: 'SET_RENDER_MODE', mode: '2d' });
    expect(schematic.stepIndex).toBe(1);
    expect(schematic.detailLevel).toBe('expert');
    expect(schematic.renderMode).toBe('2d');
  });

  it('supports direct step selection and back navigation without going out of bounds', () => {
    const started = scenarioReducer(initialScenarioState, { type: 'START' });
    expect(scenarioReducer(started, { type: 'PREVIOUS' }).stepIndex).toBe(0);
    expect(scenarioReducer(started, { type: 'GO_TO_STEP', index: 20 }).stepIndex).toBe(7);
    expect(scenarioReducer(started, { type: 'GO_TO_STEP', index: -3 }).stepIndex).toBe(0);
  });

  it('records four answers and moves to knowledge check', () => {
    let state = scenarioReducer(initialScenarioState, { type: 'START' });
    state = scenarioReducer(state, { type: 'OPEN_QUIZ' });
    for (let index = 0; index < 4; index += 1) {
      state = scenarioReducer(state, { type: 'ANSWER', questionId: `q${index}`, optionId: 'a' });
    }
    expect(state.phase).toBe('knowledge-check');
    expect(Object.keys(state.answers)).toHaveLength(4);
  });

  it('pauses playback and restarts without losing selected preferences', () => {
    const idle = scenarioReducer(initialScenarioState, { type: 'SET_PLAYING', playing: true });
    expect(idle.playing).toBe(false);
    const started = scenarioReducer(idle, { type: 'START' });
    const playing = scenarioReducer(started, { type: 'SET_PLAYING', playing: true });
    expect(playing.playing).toBe(true);
    const expert = scenarioReducer(playing, { type: 'SET_DETAIL', detail: 'expert' });
    const restarted = scenarioReducer(expert, { type: 'RESTART' });
    expect(restarted.phase).toBe('idle');
    expect(restarted.detailLevel).toBe('expert');
    expect(restarted.playing).toBe(false);
    expect(scenarioReducer(restarted, { type: 'NEXT' })).toEqual(restarted);
  });
});
