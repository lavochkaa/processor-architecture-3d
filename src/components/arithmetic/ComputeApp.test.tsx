// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import ComputeApp from './ComputeApp';

const { webglEnabled } = vi.hoisted(() => ({ webglEnabled: { current: false } }));
vi.mock('../../domain/capabilities/capabilities', () => ({ canCreateWebGLContext: () => webglEnabled.current }));
vi.mock('../../renderers/arithmetic-3d/Arithmetic3D', () => ({
  default: ({ state, onSettled }: { state: { step: number } | null; onSettled: (state: { step: number }) => void }) =>
    <button type="button" onClick={() => state && onSettled(state)}>Закрепить шаг {state?.step ?? 0}</button>
}));

beforeEach(() => {
  webglEnabled.current = false;
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ComputeApp', () => {
  it('validates on blur and submit, focuses the first invalid input, and accepts leading zero', () => {
    render(<ComputeApp />);
    const a = screen.getByRole('textbox', { name: 'Число A' });
    const b = screen.getByRole('textbox', { name: 'Число B' });
    expect(a).toHaveProperty('type', 'text');
    expect(a).toHaveProperty('inputMode', 'numeric');
    fireEvent.change(a, { target: { value: '' } });
    expect(screen.queryByText('Введите число от 0 до 15: у модели четыре бита')).toBeNull();
    fireEvent.blur(a);
    expect(a.getAttribute('aria-invalid')).toBe('true');
    expect(a.getAttribute('aria-describedby')).toContain('error');
    fireEvent.change(a, { target: { value: '01' } });
    expect(a.getAttribute('aria-invalid')).toBeNull();
    fireEvent.change(b, { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    expect(document.activeElement).toBe(b);
    expect(screen.getByRole('button', { name: 'Показать вычисление' }).hasAttribute('disabled')).toBe(false);
    fireEvent.change(b, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    expect(screen.getByText('Шаг 1 из 10')).toBeTruthy();
  });

  it('uses full live text for manual changes and only chapter changes during playback', () => {
    render(<ComputeApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/^Шаг 1 из 10\./);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(live?.textContent).toMatch(/^Шаг 2 из 10\./);
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести' }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Шаг 3 из 10')).toBeTruthy();
    expect(live?.textContent).toBe('Глава Память и регистры. Шаг 3 из 10.');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Шаг 4 из 10')).toBeTruthy();
    expect(live?.textContent).toBe('Глава ALU. Шаг 4 из 10.');
  });

  it('shows empty operand positions, unknown future sums, and the first input carry in the table', () => {
    render(<ComputeApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    fireEvent.click(screen.getByRole('button', { name: /ALU/ }));
    const table = screen.getByRole('table');
    expect(table.querySelectorAll('tbody tr')[1].querySelector('td')?.textContent).toBe('—');
    expect(table.querySelectorAll('tbody tr')[2].querySelector('td')?.textContent).toBe('—');
    expect(table.querySelectorAll('tbody tr')[0].querySelector('td:last-child')?.textContent).toBe('0');
    expect(table.querySelectorAll('tbody tr')[3].querySelectorAll('td')[1].textContent).toBe('?');
  });

  it('keeps only the latest navigation command while a 3D transfer is docking', async () => {
    webglEnabled.current = true;
    render(<ComputeApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Закрепить шаг 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(screen.getByRole('button', { name: 'Закрепить шаг 2' })).toBeTruthy();
    expect(screen.getByText('Команда ожидает закрепления')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить шаг 2' }));
    expect(screen.getByRole('button', { name: 'Закрепить шаг 3' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить шаг 3' }));
    expect(screen.getByText('Шаг 3 из 10')).toBeTruthy();
  });

  it('keeps input and playback widgets inside the scene and collapses the table on narrow screens', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 760px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    }));
    render(<ComputeApp />);
    const stage = screen.getByTestId('compute-stage');
    expect(stage.contains(screen.getByRole('button', { name: 'Показать вычисление' }))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    expect(stage.contains(screen.getByRole('button', { name: 'Дальше' }))).toBe(true);
    expect(stage.contains(screen.getByRole('button', { name: 'Воспроизвести' }))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /ALU/ }));
    expect(screen.getByRole('button', { name: 'Развернуть' })).toBeTruthy();
  });

  it('discards a queued move when the user changes the numbers', async () => {
    webglEnabled.current = true;
    render(<ComputeApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Закрепить шаг 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    fireEvent.click(screen.getByRole('button', { name: 'Изменить числа' }));
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить шаг 1' }));
    expect(screen.getByText('Шаг 1 из 10')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Закрепить шаг 2' })).toBeNull();
    expect(screen.queryByText('Команда ожидает закрепления')).toBeNull();
  });
});
