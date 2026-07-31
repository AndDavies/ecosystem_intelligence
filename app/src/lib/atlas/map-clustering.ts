export function groupProjectedPointsByGrid<T extends { projected: { x: number; y: number } }>(
  points: T[],
  cellSize = 64
) {
  const groups = new Map<string, T[]>();
  for (const point of points) {
    const key = `${Math.floor(point.projected.x / cellSize)}:${Math.floor(point.projected.y / cellSize)}`;
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }
  return [...groups.values()];
}
