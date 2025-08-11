import { describe, it, expect } from "vitest";
import { MapGrid } from "@/map/MapGrid";

describe("MapGrid", () => {
  it("carves room inside bounds", () => {
    const m = new MapGrid(10, 10);
    m.carveRoom(2,2,7,7);
    expect(m.get(2,2)).toBe("FLOOR");
    expect(m.get(7,7)).toBe("FLOOR");
    expect(m.get(0,0)).toBe("WALL");
  });
});
