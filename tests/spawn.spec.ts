import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/core/store";
import { initLevel } from "@/systems/logic";

describe("spawn", () => {
  beforeEach(() => {
    store.reset();
    initLevel();
  });

  it("player does not spawn on walls", () => {
    const p = store.state.player.pos;
    const t = store.state.map[store.idx(p.x, p.y)];
    expect(t).toBe("FLOOR");
  });

  it("no enemy shares player's tile", () => {
    const p = store.state.player.pos;
    const clash = store.state.enemies.some(e => e.pos.x === p.x && e.pos.y === p.y);
    expect(clash).toBe(false);
  });

  it("items do not spawn on enemies", () => {
    const enemySet = new Set(store.state.enemies.map(e => `${e.pos.x},${e.pos.y}`));
    const clash = store.state.items.some(i => enemySet.has(`${i.pos.x},${i.pos.y}`));
    expect(clash).toBe(false);
  });
});
