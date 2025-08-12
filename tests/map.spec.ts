import { describe, it, expect } from "vitest";

import { MapGrid } from "@/map/MapGrid";

describe("MapGrid", () => {
  it("carves room inside bounds", () => {
    const grid = new MapGrid(10, 10);
    grid.carveRoom(2,2,7,7);
    expect(grid.get(2,2)).toBe("FLOOR");
    expect(grid.get(7,7)).toBe("FLOOR");
    expect(grid.get(0,0)).toBe("WALL");
  });
});
