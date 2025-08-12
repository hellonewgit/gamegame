import { describe, it, expect } from "vitest";
import { resolveDirection } from "@/systems/input";

describe("input mapping", () => {
  it("maps EN and RU layouts to same directions", () => {
    expect(resolveDirection("w")).toEqual([0, -1]);
    expect(resolveDirection("ц")).toEqual([0, -1]);

    expect(resolveDirection("s")).toEqual([0, 1]);
    expect(resolveDirection("ы")).toEqual([0, 1]);

    expect(resolveDirection("a")).toEqual([-1, 0]);
    expect(resolveDirection("ф")).toEqual([-1, 0]);

    expect(resolveDirection("d")).toEqual([1, 0]);
    expect(resolveDirection("в")).toEqual([1, 0]);
  });
});
