// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import ComputeApp from './ComputeApp';

vi.mock('../../domain/capabilities/capabilities', () => ({ canCreateWebGLContext: () => false }));

beforeEach(() => {
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
    expect(screen.getByText('Шаг 1 из 9')).toBeTruthy();
  });

  it('uses full live text for manual changes and only chapter changes during playback', () => {
    render(<ComputeApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать вычисление' }));
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/^Шаг 1 из 9\./);
    fireEvent.click(screen.getByRole('button', { name: 'Дальше' }));
    expect(live?.textContent).toMatch(/^Шаг 2 из 9\./);
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести' }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Шаг 3 из 9')).toBeTruthy();
    expect(live?.textContent).toBe('');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Шаг 4 из 9')).toBeTruthy();
    expect(live?.textContent).toBe('Глава ALU. Шаг 4 из 9.');
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
});
