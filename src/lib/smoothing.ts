export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function applyDeadZone(value: number, deadZone: number): number {
  if (Math.abs(value) < deadZone) return 0;
  return value;
}
