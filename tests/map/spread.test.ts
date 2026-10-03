import { test } from "node:test";
import assert from "node:assert/strict";
import { spreadPins } from "../../src/features/map/spread";

const at = (id: string, lat: number, lng: number) => ({ id, lat, lng });

test("a pin alone on its point stays where it is", () => {
  const shifts = spreadPins([at("a", 47.062, 28.868), at("b", 47.081, 28.172)]);
  assert.equal(shifts.size, 0);
});

test("two reports on the same point go side by side", () => {
  const shifts = spreadPins([at("gunoi", 47.062, 28.868), at("altul", 47.062, 28.868)]);
  const [ax, ay] = shifts.get("gunoi")!;
  const [bx, by] = shifts.get("altul")!;
  assert.equal(ay, by);
  // the pins are 32 px wide
  assert.ok(Math.abs(ax - bx) >= 32);
});

test("every pin of a big stack gets its own spot, apart from the others", () => {
  const stack = Array.from({ length: 13 }, (_, i) => at(`r${i}`, 47.081, 28.172));
  const shifts = [...spreadPins(stack).values()];
  assert.equal(shifts.length, 13);
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const d = Math.hypot(shifts[i][0] - shifts[j][0], shifts[i][1] - shifts[j][1]);
      assert.ok(d >= 32, `r${i} and r${j} are ${d} px apart`);
    }
  }
});

test("only reports on exactly the same point are spread", () => {
  const shifts = spreadPins([at("a", 47.08, 28.173), at("b", 47.081, 28.172), at("c", 47.081, 28.172)]);
  assert.deepEqual([...shifts.keys()].sort(), ["b", "c"]);
});
