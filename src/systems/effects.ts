import { store } from "@/core/store";

export function tickEffects(dt: number) {
  store.update(s => {
    s.effects = s.effects
      .map(e => ({ ...e, t: e.t - dt }))
      .filter(e => e.t > 0);
  });
}
