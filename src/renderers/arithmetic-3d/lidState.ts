/** A partial opening on the register and write-back steps keeps the CPU in context. */
export function lidOpenForStep(step: number | null): number {
  if (step === 3 || step === 9) return .52;
  if (step !== null && step >= 4 && step <= 8) return 1;
  return 0;
}
