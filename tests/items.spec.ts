import { describe, it, expect, beforeEach } from "vitest";

import { store } from "@/core/store";
import { initLevel, stepTurn } from "@/systems/logic";

describe("items", () => {
  beforeEach(() => {
    store.reset();
    initLevel();
  });

  it("level spawns only potion or sword (no other kinds)", () => {
    const kinds = new Set(store.state.items.map(i => i.kind));
    for (const k of kinds) {
      expect(["potion", "sword"]).toContain(k);
    }
  });

  it("picking up sword increases player attack by item.value", () => {
    const startAtk = store.state.player.attack;
    // place sword at player position
    store.update(state => {
      state.items.push({ id: "testSword", pos: { ...state.player.pos }, kind: "sword", value: 3 });
    });
    // make a zero move to trigger pickup phase
    (store.state as any)._intent = { dx: 0, dy: 0 };
    stepTurn();
    expect(store.state.player.attack).toBe(startAtk + 3);
  });
});
