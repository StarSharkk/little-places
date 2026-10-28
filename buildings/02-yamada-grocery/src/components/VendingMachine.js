import { group, box, cyl, sign } from "./primitives.js";
export function VendingMachine(
  parent,
  m,
  atlas,
  { pos = [0, 0, 0], rotation = 0, green = false } = {},
) {
  const g = group(
    parent,
    pos,
    rotation,
    green ? "Tea vending machine" : "Drinks vending machine",
  );
  const body = green ? m.green : m.trim;
  box(g, 1.02, 1.86, 0.72, body, [0, 0.99, 0]);
  box(g, 1.06, 0.11, 0.76, m.steel, [0, 0.105, 0]);
  box(g, 1.07, 0.075, 0.77, body, [0, 1.94, 0]);
  box(g, 0.94, 1.72, 0.04, m.ink, [0, 1.02, 0.38]);
  atlas.attach(
    g,
    green ? "vendingGreen" : "vending",
    0.9,
    1.69,
    [0, 1.03, 0.405],
  );
  for (const x of [-0.4, 0.4]) box(g, 0.12, 0.12, 0.15, m.ink, [x, 0.04, 0.22]);
  box(g, 0.62, 0.055, 0.06, m.steel, [-0.08, 0.35, 0.45]);
  box(g, 0.06, 0.16, 0.08, m.steel, [0.4, 0.68, 0.43]);
  for (let y = 0.26; y < 0.57; y += 0.065)
    box(g, 0.02, 0.015, 0.4, m.ink, [-0.521, y, 0], false);
  return g;
}
