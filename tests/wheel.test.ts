import { describe, expect, it } from "vitest";
import { angleUnderPointer, layoutSlices, targetRotation } from "@/lib/wheel";

const slices = layoutSlices([
  { id: "a", label: "A", color: "#000", p: 0.5 },
  { id: "b", label: "B", color: "#000", p: 0.3 },
  { id: "c", label: "C", color: "#000", p: 0.2 },
]);

describe("ruota", () => {
  it("gli spicchi coprono il giro", () => {
    expect(slices[0].start).toBe(0);
    expect(slices[2].end).toBeCloseTo(360, 10);
  });

  it("la freccia si ferma sempre nello spicchio vincente, girando in avanti", () => {
    let current = 0;
    for (let i = 0; i < 200; i++) {
      const s = slices[i % 3];
      const next = targetRotation(s, current, Math.random);
      expect(next - current).toBeGreaterThanOrEqual(6 * 360);
      const a = angleUnderPointer(next);
      expect(a).toBeGreaterThan(s.start);
      expect(a).toBeLessThan(s.end);
      current = next;
    }
  });
});
