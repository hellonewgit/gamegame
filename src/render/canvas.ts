import { CELL, MAX_HP } from "@/core/constants";
import { store } from "@/core/store";
import { assets } from "@/render/assets";

let ctx: CanvasRenderingContext2D;
let currentScale = 1; // CSS pixels per logical pixel

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
  const s = store.state;
  const targetW = s.width * CELL;
  const targetH = s.height * CELL;
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
}

export function render() {
  const s = store.state;
  const { width, height } = s;
  ctx.fillStyle = "#0d0f14";
  ctx.fillRect(0, 0, width * CELL, height * CELL);

  // карта
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = s.map[y * width + x];
      const px = x * CELL, py = y * CELL;
      if (t === "WALL") {
        if (assets.wall) ctx.drawImage(assets.wall, px, py, CELL, CELL);
        else { ctx.fillStyle = "#151a22"; ctx.fillRect(px, py, CELL, CELL); }
      } else {
        if (assets.floor) ctx.drawImage(assets.floor, px, py, CELL, CELL);
        else { ctx.fillStyle = "#202636"; ctx.fillRect(px, py, CELL, CELL); }
      }
    }
  }

  // предметы
  for (const it of s.items) {
    const px = it.pos.x * CELL, py = it.pos.y * CELL;
    if (it.kind === "potion") {
      if (assets.potion) ctx.drawImage(assets.potion, px, py, CELL, CELL);
      else { ctx.fillStyle = "#6be675"; ctx.fillRect(px + 8, py + 8, CELL - 16, CELL - 16); }
    } else {
      if (assets.gold) ctx.drawImage(assets.gold, px, py, CELL, CELL);
      else { ctx.fillStyle = "#e6d96b"; ctx.fillRect(px + 8, py + 8, CELL - 16, CELL - 16); }
    }
  }

  // враги
  for (const e of s.enemies) {
    const px = e.pos.x * CELL, py = e.pos.y * CELL;
    if (assets.enemy) ctx.drawImage(assets.enemy, px, py, CELL, CELL);
    else { ctx.fillStyle = "#e35d5b"; ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8); }

    // HP bar (enemy): max 40 как в оригинале
    const maxHp = 40;
    const ratio = Math.max(0, Math.min(1, e.hp / maxHp));
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
    const px = s.player.pos.x * CELL, py = s.player.pos.y * CELL;
    if (assets.player) ctx.drawImage(assets.player, px, py, CELL, CELL);
    else { ctx.fillStyle = "#67a6ff"; ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8); }

    // HP bar (player)
    const barW = CELL - 4;
    const bx = px + 2, by = py - 5;
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(bx, by, barW, 4);
    const ratio = Math.max(0, Math.min(1, s.player.hp / MAX_HP));
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(bx, by, Math.floor(barW * ratio), 4);
  }

  // эффекты
  for (const fx of s.effects) {
    ctx.globalAlpha = Math.max(0, Math.min(1, fx.t / 120));
    ctx.fillStyle = fx.color;
    ctx.fillRect(fx.pos.x * CELL, fx.pos.y * CELL, CELL, CELL);
    ctx.globalAlpha = 1;
  }

  // HUD title как в оригинале
  const title = document.getElementById("title");
  if (title) title.textContent = `Игровое поле. Здоровья: ${s.player.hp} Атака: ${s.player.attack}`;
}
