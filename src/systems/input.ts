import { store } from "@/core/store";

export type Direction = [number, number];

/* eslint-disable id-length */
const KEY_TO_DIR: Record<string, Direction> = {
  // EN
  w: [0, -1], arrowup: [0, -1],
  s: [0, 1], arrowdown: [0, 1],
  a: [-1, 0], arrowleft: [-1, 0],
  d: [1, 0], arrowright: [1, 0],
  // RU (ЙЦУКЕН)
  ц: [0, -1],
  ы: [0, 1],
  ф: [-1, 0],
  в: [1, 0]
};
/* eslint-enable id-length */

export function resolveDirection(key: string): Direction | undefined {
  return KEY_TO_DIR[key.toLowerCase()];
}

let enabled = false;

export function enableInput() {
  if (enabled) return;
  enabled = true;
  window.addEventListener("keydown", onKey);
}
export function disableInput() {
  if (!enabled) return;
  enabled = false;
  window.removeEventListener("keydown", onKey);
}

function onKey(event: KeyboardEvent) {
  if (store.state.inputLocked) return;
  const key = event.key;
  if (key === ' ') {
    event.preventDefault();
    store.update(state => { (state as any)._attack = true; });
    return;
  }
  const direction = resolveDirection(key);
  if (!direction) return;
  event.preventDefault();
  store.update(state => { (state as any)._intent = { dx: direction[0], dy: direction[1] }; });
}
