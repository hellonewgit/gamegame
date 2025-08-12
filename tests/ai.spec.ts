import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/core/store";
import { initLevel, stepTurn } from "@/systems/logic";

function setPlayer(pos: { x: number; y: number }) {
  store.update(state => { state.player.pos = { ...pos }; });
}

describe("enemy AI", () => {
  beforeEach(() => {
    store.reset();
    initLevel();
  });

  it("attacking the player consumes turn (enemy does not move)", () => {
    // place one enemy adjacent to player
    const p = { ...store.state.player.pos };
    if (store.state.enemies.length === 0) {
      // ensure at least one enemy exists
      store.update(state => { state.enemies.push({ id: "e-test", pos: { x: p.x + 2, y: p.y }, hp: 10, attack: 3, kind: "enemy" }); });
    }
    const enemy = store.state.enemies[0]!;
    enemy.pos = { x: p.x + 1, y: p.y }; // adjacent
    const before = { ...enemy.pos };
    const hpBefore = store.state.player.hp;

    // trigger a turn without moving player
    (store.state as any)._intent = { dx: 0, dy: 0 };
    stepTurn();

    expect(enemy.pos).toEqual(before);
    expect(store.state.player.hp).toBeLessThan(hpBefore);
  });
});
