import { describe, it, expect, beforeEach } from "vitest";

import { store } from "@/core/store";
import { initLevel } from "@/systems/logic";

describe("spawn", () => {
  beforeEach(() => {
    store.reset();
    initLevel();
  });

  it("player does not spawn on walls", () => {
    const playerPos = store.state.player.pos;
    const tile = store.state.map[store.idx(playerPos.x, playerPos.y)];
    expect(tile).toBe("FLOOR");
  });

  it("no enemy shares player's tile", () => {
    const playerPos = store.state.player.pos;
    const clash = store.state.enemies.some(enemy => enemy.pos.x === playerPos.x && enemy.pos.y === playerPos.y);
    expect(clash).toBe(false);
  });

  it("items do not spawn on enemies", () => {
    const enemySet = new Set(store.state.enemies.map(enemy => `${enemy.pos.x},${enemy.pos.y}`));
    const clash = store.state.items.some(item => enemySet.has(`${item.pos.x},${item.pos.y}`));
    expect(clash).toBe(false);
  });
});
