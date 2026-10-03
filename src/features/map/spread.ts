// The maps show every location rounded to about 100 m, so reports from the same block land on
// exactly the same point and their pins cover each other: only the one drawn last could be seen
// or clicked. Pins that share a point go on a small ring around it instead. The shift is in screen
// pixels and the point stays the rounded one, so it tells nobody a more precise location.

type Point = { id: string; lat: number; lng: number };

// pins are 32 px wide, so neighbours on the ring stay this far apart
const gap = 36;
const minRadius = 20;

// The shift in pixels of each pin that shares its point, by report id. Lone pins are left out.
export function spreadPins(points: Point[]): Map<string, [number, number]> {
  const stacks = new Map<string, string[]>();
  for (const p of points) {
    const key = `${p.lat},${p.lng}`;
    const stack = stacks.get(key);
    if (stack) stack.push(p.id);
    else stacks.set(key, [p.id]);
  }

  const shifts = new Map<string, [number, number]>();
  for (const ids of stacks.values()) {
    if (ids.length < 2) continue;
    const radius = Math.max(minRadius, gap / 2 / Math.sin(Math.PI / ids.length));
    ids.forEach((id, i) => {
      // the first one on the left, the rest clockwise
      const angle = Math.PI + (2 * Math.PI * i) / ids.length;
      shifts.set(id, [px(radius * Math.cos(angle)), px(radius * Math.sin(angle))]);
    });
  }
  return shifts;
}

// whole pixels, and 0 instead of -0
function px(v: number) {
  return Math.round(v) || 0;
}
