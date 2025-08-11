import { store } from "@/core/store";
import { MapGrid } from "@/map/MapGrid";
import type { Position, Item } from "@/core/types";
import { MAX_HP } from "@/core/constants";

let map: MapGrid;

export function initLevel() {
  const s = store.state;
  map = new MapGrid(s.width, s.height);
  // Генератор как в оригинале: открытое поле, 10 прямоугольников-стен
  const rand = (a: number, b: number) => Math.floor(store.rng() * (b - a + 1)) + a;
  // сначала всё пол
  for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) map.set(x, y, "FLOOR");
  const carveArea = (x0: number, y0: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) map.set(x0 + dx, y0 + dy, "WALL");
  };
  for (let i = 0; i < 10; i++) {
    const w = rand(3, 8);
    const h = rand(3, 8);
    const x0 = rand(1, s.width - w - 1);
    const y0 = rand(1, s.height - h - 1);
    carveArea(x0, y0, w, h);
  }

  store.update(st => {
    st.map = map.tiles;
    st.player.pos = findEmpty();
    st.enemies = [];
    st.items = [];
    // точное соответствие оригиналу: 10 врагов, 10 HP, 2 SW
    spawnEnemiesExact();
    spawnItemsExact();
  });
}

export function stepTurn() {
  const s = store.state;
  const intent = (s as any)._intent as { dx: number; dy: number } | undefined;
  const attack = (s as any)._attack as boolean | undefined;
  (s as any)._intent = undefined;
  (s as any)._attack = undefined;

  if (intent) {
    moveActor(s.player.pos, intent.dx, intent.dy);
    aiPhase();
    combatPhase();
    endPhase();
  } else if (attack) {
    playerAttack();
    aiPhase();
    combatPhase();
    endPhase();
  }
}

function isWalkable(p: Position) {
  if (!store.isInside(p)) return false;
  const t = store.state.map[store.idx(p.x, p.y)];
  return t === "FLOOR";
}

function occupiedByEnemy(p: Position) {
  return store.state.enemies.find(e => e.pos.x === p.x && e.pos.y === p.y);
}

function moveActor(pos: Position, dx: number, dy: number) {
  const next = { x: pos.x + dx, y: pos.y + dy };
  if (!isWalkable(next)) return;
  // нельзя шагать на врага — атака отдельной кнопкой (SPACE)
  if (occupiedByEnemy(next)) return;

  store.update(s => { s.player.pos = next; });
  pickupPhase();
}

function pickupPhase() {
  store.update(s => {
    const i = s.items.findIndex(it => it.pos.x === s.player.pos.x && it.pos.y === s.player.pos.y);
    if (i >= 0) {
      const item = s.items[i]!;
      if (item.kind === "potion") s.player.hp = MAX_HP; // полное лечение
      if (item.kind === "gold") s.player.attack += 10; // меч усиливает атаку на 10
      s.items.splice(i, 1);
    }
  });
}

function aiPhase() {
  store.update(s => {
    for (const e of s.enemies) {
      const dxTo = Math.sign(s.player.pos.x - e.pos.x);
      const dyTo = Math.sign(s.player.pos.y - e.pos.y);

      // если рядом по чебышевскому расстоянию — бьём
      const cheb = Math.max(Math.abs(s.player.pos.x - e.pos.x), Math.abs(s.player.pos.y - e.pos.y));
      if (cheb <= 1) {
        s.player.hp -= e.attack;
        s.effects.push({ pos: { ...s.player.pos }, t: 120, color: "#ffd166" });
        if (s.player.hp <= 0) {
          alert("Game Over!");
          s.player.hp = MAX_HP; // как в оригинале — лечим и продолжаем
        }
        continue;
      }

      // случайно выбираем ось, как в оригинале
      const step = { x: e.pos.x, y: e.pos.y };
      if (Math.random() < 0.5) step.x += dxTo; else step.y += dyTo;

      if (!isWalkable(step)) continue;
      if (s.enemies.some(other => other !== e && other.pos.x === step.x && other.pos.y === step.y)) continue;
      if (step.x === s.player.pos.x && step.y === s.player.pos.y) continue;
      e.pos = step;
    }
  });
}

function combatPhase() {
  // точка расширения под бафы/статусы
}

function endPhase() {
  // победный цикл как в оригинале: когда врагов нет — новая волна и лут
  store.update(s => {
    if (s.enemies.length === 0) {
      alert("You Win!");
      spawnItemsExact();
      spawnEnemiesExact();
    }
  });
}

function playerAttack() {
  const dirs = [
    { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
  ];
  store.update(s => {
    const px = s.player.pos.x, py = s.player.pos.y;
    const hit: typeof s.enemies = [];
    for (const d of dirs) {
      const x = px + d.x, y = py + d.y;
      s.effects.push({ pos: { x, y }, t: 120, color: "#ffee58" });
      const target = s.enemies.find(e => e.pos.x === x && e.pos.y === y);
      if (target) hit.push(target);
    }
    for (const t of hit) {
      t.hp -= s.player.attack;
      if (t.hp <= 0) s.enemies = s.enemies.filter(e => e !== t);
    }
  });
}

function findEmpty(): Position {
  while (true) {
    const x = Math.floor(store.rng() * store.state.width);
    const y = Math.floor(store.rng() * store.state.height);
    if (map.get(x, y) === "FLOOR" && !occupiedByEnemy({ x, y })) return { x, y };
  }
}

function spawnEnemy() {
  const pos = findEmpty();
  return { id: `e${Math.random()}`, pos, hp: 40, attack: 3, kind: "enemy" as const };
}

function spawnItem(kind: Item["kind"], value: number): Item {
  const pos = findEmpty();
  return { id: `i${Math.random()}`, pos, kind, value };
}

function spawnItemsExact() {
  store.update(s => {
    // 10 HP и 2 SW как в оригинале
    for (let i = 0; i < 10; i++) s.items.push(spawnItem("potion", 1));
    for (let i = 0; i < 2; i++) s.items.push(spawnItem("gold", 1));
  });
}

function spawnEnemiesExact() {
  store.update(s => {
    for (let i = 0; i < 10; i++) s.enemies.push(spawnEnemy());
  });
}
