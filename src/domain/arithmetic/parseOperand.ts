export const OPERAND_ERROR = 'Введите число от 0 до 15: у модели четыре бита';

export function parseOperand(input: string): number | null {
  const normalized = input.trim();
  if (!/^\d{1,2}$/.test(normalized)) return null;
  const value = Number(normalized);
  return value <= 15 ? value : null;
}
