import { enableInput, disableInput } from "@/systems/input";
import { initLevel, stepTurn } from "@/systems/logic";
import { tickEffects } from "@/systems/effects";
import { initCanvas, resizeCanvas, render } from "@/render/canvas";
import { store } from "@/core/store";
import { TURN_MS } from "@/core/constants";
import { loadAssets } from "@/render/assets";

let accumulatorMs = 0;
let lastTimestamp = 0;
let rafId = 0;

function frame(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  accumulatorMs += deltaMs;
  while (accumulatorMs >= TURN_MS) {
    stepTurn();
    tickEffects(TURN_MS);
    accumulatorMs -= TURN_MS;
  }
  render();
  rafId = requestAnimationFrame(frame);
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
    rafId = requestAnimationFrame(frame);
    // keep centered on resize without dynamic import
    window.addEventListener("resize", () => {
      const canvasEl = document.getElementById("game") as HTMLCanvasElement | null;
      if (canvasEl) resizeCanvas(canvasEl);
    });
    window.addEventListener("beforeunload", () => {
      disableInput();
      cancelAnimationFrame(rafId);
    });
  }
};
