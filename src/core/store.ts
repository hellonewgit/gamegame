import type { GameState, Position } from "./types";
import { mulberry32 } from "./rng";
import { MAX_HP } from "./constants";

function makeEmptyState(): GameState {
  return {
    width: 32,
    height: 32,
    floor: 1,
    map: [],
    player: { id: "player", pos: { x: 1, y: 1 }, hp: MAX_HP, attack: 10, kind: "player" },
    enemies: [],
    items: [],
    effects: [],
    inputLocked: false,
    rngSeed: Date.now() & 0xfffffff
  };
}

type Listener = (s: GameState) => void;

class Store {
  public state: GameState = makeEmptyState();
  #listeners: Set<Listener> = new Set();
  rng = mulberry32(this.state.rngSeed);

  reset() {
    // мутируем поля, НЕ переприсваиваем ссылку state
    const next = makeEmptyState();
    Object.assign(this.state, next);
    this.rng = mulberry32(this.state.rngSeed);
    this.emit();
  }

  update(mutator: (s: GameState) => void) {
    mutator(this.state);
    this.emit();
  }

  on(fn: Listener) { this.#listeners.add(fn); return () => this.#listeners.delete(fn); }
  emit() { for (const fn of this.#listeners) fn(this.state); }

  isInside(p: Position) { return p.x >= 0 && p.y >= 0 && p.x < this.state.width && p.y < this.state.height; }
  idx(x: number, y: number) { return y * this.state.width + x; }
}
export const store = new Store();
