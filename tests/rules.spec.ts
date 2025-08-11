import { describe, it, expect } from "vitest";
import { store } from "@/core/store";

describe("helpers", () => {
  it("index is stable", () => {
    expect(store.idx(0,0)).toBe(0);
    expect(store.idx(1,0)).toBe(1);
  });
});
