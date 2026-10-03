export function gameLengthAxisMax(maxDays: number): number {
  return Math.max(maxDays, 4);
}

export function gameLengthAxisTicks(maxDays: number): number[] {
  const axisMax = gameLengthAxisMax(maxDays);
  const ticks = [0, 1, 2, 3, 4].map((index) => Math.round((index * axisMax) / 4));
  return [...new Set(ticks)];
}
