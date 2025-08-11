import { store } from "@/core/store";

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

function onKey(e: KeyboardEvent) {
  if (store.state.inputLocked) return;
  const key = e.key.toLowerCase();
  const map: Record<string, [number, number]> = {
    w: [0, -1], arrowup: [0, -1],
    s: [0, 1],  arrowdown: [0, 1],
    a: [-1, 0], arrowleft: [-1, 0],
    d: [1, 0],  arrowright: [1, 0]
  };
  if (key === ' ') {
    e.preventDefault();
    store.update(s => { (s as any)._attack = true; });
    return;
  }
  const d = map[key];
  if (!d) return;
  e.preventDefault();
  store.update(s => { (s as any)._intent = { dx: d[0], dy: d[1] }; });
}
