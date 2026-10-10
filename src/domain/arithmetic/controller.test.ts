import { describe, expect, it } from 'vitest';
import { createControllerState, currentTraceState, reduceController } from './controller';

describe('addition controller', () => {
  it('starts on step 1 and supports reversible manual navigation from one trace', () => {
    const started = reduceController(createControllerState(), { type: 'start', a: 11, b: 6 });
    expect(currentTraceState(started)?.step).toBe(1);
    expect(started.announcement).toEqual({ kind: 'step', step: 1 });
    const forward = reduceController(started, { type: 'next' });
    expect(currentTraceState(forward)?.step).toBe(2);
    expect(forward.announcement).toEqual({ kind: 'step', step: 2 });
    const returned = reduceController(forward, { type: 'previous' });
    expect(currentTraceState(returned)).toEqual(currentTraceState(started));
    expect(reduceController(returned, { type: 'previous' }).trace).toBeNull();
  });

  it('chapter jumps choose the same immutable state as linear traversal', () => {
    const started = reduceController(createControllerState(), { type: 'start', a: 15, b: 15 });
    let linear = started;
    for (let step = 0; step < 3; step += 1) linear = reduceController(linear, { type: 'next' });
    const jump = reduceController(started, { type: 'jump-chapter', chapter: 'alu' });
    expect(currentTraceState(jump)).toEqual(currentTraceState(linear));
    expect(jump.playing).toBe(false);
    expect(jump.announcement).toEqual({ kind: 'step', step: 4 });
    expect(currentTraceState(reduceController(started, { type: 'jump-chapter', chapter: 'memory' }))?.step).toBe(3);
  });

  it('announces only chapter changes and stopping during automatic playback', () => {
    let state = reduceController(createControllerState(), { type: 'start', a: 11, b: 6 });
    state = reduceController(state, { type: 'play' });
    state = reduceController(state, { type: 'tick' });
    expect(state.announcement).toBeNull();
    state = reduceController(state, { type: 'tick' });
    expect(state.announcement).toEqual({ kind: 'chapter', chapter: 'memory', step: 3 });
    state = reduceController(state, { type: 'tick' });
    expect(state.announcement).toEqual({ kind: 'chapter', chapter: 'alu', step: 4 });
    state = reduceController(state, { type: 'pause' });
    expect(state.announcement).toEqual({ kind: 'stop', step: 4 });
    expect(state.playing).toBe(false);
  });

  it('stops autoplay on manual navigation and never passes step 10', () => {
    let state = reduceController(createControllerState(), { type: 'start', a: 0, b: 0 });
    state = reduceController(state, { type: 'play' });
    state = reduceController(state, { type: 'next' });
    expect(state.playing).toBe(false);
    for (let step = 0; step < 20; step += 1) state = reduceController(state, { type: 'next' });
    expect(currentTraceState(state)?.step).toBe(10);
    expect(state.playing).toBe(false);
  });

  it('changes speed without changing the selected trace state', () => {
    const started = reduceController(createControllerState(), { type: 'start', a: 7, b: 8 });
    const faster = reduceController(started, { type: 'speed', speed: 2 });
    expect(faster.speed).toBe(2);
    expect(currentTraceState(faster)).toBe(currentTraceState(started));
  });
});
