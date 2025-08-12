import { CELL, MAX_HP } from "@/core/constants";
import { store } from "@/core/store";
import { assets } from "@/render/assets";

let ctx: CanvasRenderingContext2D;
let currentScale = 1; // CSS pixels per logical pixel
let titleEl: HTMLElement | null = null;

function computeScale(targetW: number, targetH: number) {
  const padding = 32; // leave room around the board
  const vw = Math.max(1, window.innerWidth - padding * 2);
  const vh = Math.max(1, window.innerHeight - padding * 2);
  // integer scale for crisp pixels
  const scale = Math.max(1, Math.floor(Math.min(vw / targetW, vh / targetH)));
  return scale;
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio));
  const state = store.state;
  const targetW = state.width * CELL;
  const targetH = state.height * CELL;
  currentScale = computeScale(targetW, targetH);
  const cssW = targetW * currentScale;
  const cssH = targetH * currentScale;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  if (!ctx) ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr * currentScale, 0, 0, dpr * currentScale, 0, 0);
}

export function initCanvas(canvas: HTMLCanvasElement) {
  ctx = canvas.getContext("2d")!;
  resizeCanvas(canvas);
  // cache HUD elements used every frame
  if (!titleEl) titleEl = document.getElementById("title");
}

export function render() {
  if (!ctx) return; // not initialized yet
  const state = store.state;
  const { width, height } = state;
  ctx.fillStyle = "#0d0f14";
  ctx.fillRect(0, 0, width * CELL, height * CELL);

  // карта
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = state.map[y * width + x];
      const px = x * CELL, py = y * CELL;
      if (tile === "WALL") {
        if (assets.wall) ctx.drawImage(assets.wall, px, py, CELL, CELL);
        else { ctx.fillStyle = "#151a22"; ctx.fillRect(px, py, CELL, CELL); }
      } else {
        if (assets.floor) ctx.drawImage(assets.floor, px, py, CELL, CELL);
        else { ctx.fillStyle = "#202636"; ctx.fillRect(px, py, CELL, CELL); }
      }
    }
  }

  // предметы
  for (const item of state.items) {
    const px = item.pos.x * CELL, py = item.pos.y * CELL;
    if (item.kind === "potion") {
      if (assets.potion) ctx.drawImage(assets.potion, px, py, CELL, CELL);
      else { ctx.fillStyle = "#6be675"; ctx.fillRect(px + 8, py + 8, CELL - 16, CELL - 16); }
    } else {
      if (assets.sword) ctx.drawImage(assets.sword, px, py, CELL, CELL);
      else { ctx.fillStyle = "#9bd1ff"; ctx.fillRect(px + 8, py + 8, CELL - 16, CELL - 16); }
    }
  }

  // враги
  for (const enemy of state.enemies) {
    const px = enemy.pos.x * CELL, py = enemy.pos.y * CELL;
    if (assets.enemy) ctx.drawImage(assets.enemy, px, py, CELL, CELL);
    else { ctx.fillStyle = "#e35d5b"; ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8); }

    // HP bar (enemy): max 40
    const maxHp = 40;
    const ratio = Math.max(0, Math.min(1, enemy.hp / maxHp));
    const barW = CELL - 4;
    const bx = px + 2, by = py - 4; // above sprite
    // background
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(bx, by, barW, 3);
    // foreground
    ctx.fillStyle = "#ff4d4f";
    ctx.fillRect(bx, by, Math.floor(barW * ratio), 3);
  }

  // игрок
  {
    const px = state.player.pos.x * CELL, py = state.player.pos.y * CELL;
    if (assets.player) ctx.drawImage(assets.player, px, py, CELL, CELL);
    else { ctx.fillStyle = "#67a6ff"; ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8); }

    // HP bar (player)
    const barW = CELL - 4;
    const bx = px + 2, by = py - 5;
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(bx, by, barW, 4);
    const ratio = Math.max(0, Math.min(1, state.player.hp / MAX_HP));
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(bx, by, Math.floor(barW * ratio), 4);
  }

  // эффекты
  for (const effect of state.effects) {
    ctx.globalAlpha = Math.max(0, Math.min(1, effect.ttlMs / 120));
    ctx.fillStyle = effect.color;
    ctx.fillRect(effect.pos.x * CELL, effect.pos.y * CELL, CELL, CELL);
    ctx.globalAlpha = 1;
  }

  // HUD title
  if (titleEl) titleEl.textContent = `Игровое поле. Здоровья: ${state.player.hp} Атака: ${state.player.attack}`;
}
