import { describe, it, expect } from "vitest";
import { store } from "@/core/store";

describe("store reset", () => {
  it("reset mutates fields without replacing state reference", () => {
    const ref = store.state;
    const prevSeed = store.state.rngSeed;
    store.reset();
    expect(store.state).toBe(ref);
    expect(store.state.rngSeed).not.toBe(prevSeed);
  });
});
