import { store } from "@/core/store";

export function tickEffects(deltaMs: number) {
  store.update(state => {
    state.effects = state.effects
      .map(effect => ({ ...effect, ttlMs: effect.ttlMs - deltaMs }))
      .filter(effect => effect.ttlMs > 0)
      .slice(-64);
  });
}
