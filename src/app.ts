import { enableInput, disableInput } from "@/systems/input";
import { initLevel, stepTurn } from "@/systems/logic";
import { tickEffects } from "@/systems/effects";
import { initCanvas, resizeCanvas, render } from "@/render/canvas";
import { store } from "@/core/store";
import { TURN_MS } from "@/core/constants";
import { loadAssets } from "@/render/assets";

let acc = 0;
let last = 0;
let raf = 0;

function frame(ts: number) {
  if (!last) last = ts;
  const dt = ts - last;
  last = ts;

  acc += dt;
  while (acc >= TURN_MS) {
    stepTurn();
    tickEffects(TURN_MS);
    acc -= TURN_MS;
  }
  render();
  raf = requestAnimationFrame(frame);
}

function bindOverlay() {
  const overlay = document.getElementById("overlay")!;
  const overlayTitle = document.getElementById("overlay-title")!;
  document.getElementById("restart")!.addEventListener("click", () => {
    overlay.classList.remove("show");
    store.reset();
    initLevel();
  });
  // subscribe to overlay changes
  store.on(state => {
    if (state.uiOverlay) {
      overlayTitle.textContent = state.uiOverlay;
      overlay.classList.add("show");
    } else {
      overlay.classList.remove("show");
    }
  });
}

export const app = {
  async init() {
    const canvas = document.getElementById("game") as HTMLCanvasElement;
    initCanvas(canvas);
    bindOverlay();
    await loadAssets();
    store.reset();
    initLevel();
    enableInput();
    raf = requestAnimationFrame(frame);
    // keep centered on resize without dynamic import
    window.addEventListener("resize", () => {
      const c = document.getElementById("game") as HTMLCanvasElement | null;
      if (c) resizeCanvas(c);
    });
    window.addEventListener("beforeunload", () => {
      disableInput();
      cancelAnimationFrame(raf);
    });
  }
};
