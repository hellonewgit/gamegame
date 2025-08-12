import { store } from "@/core/store";
import { MapGrid } from "@/map/MapGrid";
import type { Position, Item } from "@/core/types";
import { MAX_HP } from "@/core/constants";

let map: MapGrid;
let idCounter = 0;

export function initLevel() {
  const s = store.state;
  map = new MapGrid(s.width, s.height);
  const rand = (a: number, b: number) => Math.floor(store.rng() * (b - a + 1)) + a;
  type Room = { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number };
  const rooms: Room[] = [];

  const targetRooms = rand(5, 10);
  let attempts = 0;
  while (rooms.length < targetRooms && attempts < targetRooms * 20) {
    attempts++;
    const rw = rand(3, 8);
    const rh = rand(3, 8);
    const x0 = rand(1, Math.max(1, s.width - rw - 2));
    const y0 = rand(1, Math.max(1, s.height - rh - 2));
    const x1 = x0 + rw - 1;
    const y1 = y0 + rh - 1;
    const overlaps = rooms.some(r => !(x1 + 1 < r.x0 - 1 || x0 - 1 > r.x1 + 1 || y1 + 1 < r.y0 - 1 || y0 - 1 > r.y1 + 1));
    if (overlaps) continue;
    map.carveRoom(x0, y0, x1, y1);
    const cx = Math.floor((x0 + x1) / 2);
    const cy = Math.floor((y0 + y1) / 2);
    rooms.push({ x0, y0, x1, y1, cx, cy });
  }

  if (rooms.length < 3) {
    const w = Math.max(6, Math.floor(s.width / 3));
    const h = Math.max(6, Math.floor(s.height / 3));
    const x0 = Math.floor((s.width - w) / 2);
    const y0 = Math.floor((s.height - h) / 2);
    const x1 = x0 + w - 1;
    const y1 = y0 + h - 1;
    map.carveRoom(x0, y0, x1, y1);
    rooms.push({ x0, y0, x1, y1, cx: Math.floor((x0 + x1) / 2), cy: Math.floor((y0 + y1) / 2) });
  }

  rooms.sort((a, b) => a.cx - b.cx + (a.cy - b.cy));
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1]!; const b = rooms[i]!;
    map.carveCorridor(a.cx, a.cy, b.cx, b.cy);
  }

  const extra = Math.min(rooms.length, rand(2, 4));
  for (let i = 0; i < extra; i++) {
    const ai = rand(0, rooms.length - 1);
    const bi = rand(0, rooms.length - 1);
    if (ai === bi) continue;
    const a = rooms[ai]!; const b = rooms[bi]!;
    map.carveCorridor(a.cx, a.cy, b.cx, b.cy);
  }

  store.update(state => {
    state.map = map.tiles;
    state.player.pos = findEmpty();
    state.enemies = [];
    state.items = [];
    state.uiOverlay = undefined;
    state.inputLocked = false;
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
  if (occupiedByEnemy(next)) return;

  store.update(s => { s.player.pos = next; });
  pickupPhase();
}

function pickupPhase() {
  store.update(state => {
    const idx = state.items.findIndex(item => item.pos.x === state.player.pos.x && item.pos.y === state.player.pos.y);
    if (idx >= 0) {
      const item = state.items[idx]!;
      if (item.kind === "potion") state.player.hp = Math.min(MAX_HP, state.player.hp + item.value);
      if (item.kind === "sword") state.player.attack += item.value;
      state.items.splice(idx, 1);
    }
  });
}

function aiPhase() {
  store.update(state => {
    for (const enemy of state.enemies) {
      const towardX = Math.sign(state.player.pos.x - enemy.pos.x);
      const towardY = Math.sign(state.player.pos.y - enemy.pos.y);

      const chebyshev = Math.max(Math.abs(state.player.pos.x - enemy.pos.x), Math.abs(state.player.pos.y - enemy.pos.y));
      // Если соседствует с игроком — атакует и НЕ двигается
      if (chebyshev <= 1) {
        state.player.hp -= enemy.attack;
        state.effects.push({ pos: { ...state.player.pos }, t: 120, color: "#ffd166" });
        if (state.player.hp <= 0) {
          state.uiOverlay = "Игра окончена";
          state.inputLocked = true;
          state.player.hp = MAX_HP;
        }
        continue;
      }

      const randomStep = store.rng() < 0.3; // 30% — случайный сдвиг
      const candidateSteps: Position[] = [];
      if (randomStep) {
        candidateSteps.push(
          { x: enemy.pos.x + 1, y: enemy.pos.y },
          { x: enemy.pos.x - 1, y: enemy.pos.y },
          { x: enemy.pos.x, y: enemy.pos.y + 1 },
          { x: enemy.pos.x, y: enemy.pos.y - 1 }
        );
      } else {
        if (Math.abs(state.player.pos.x - enemy.pos.x) >= Math.abs(state.player.pos.y - enemy.pos.y)) {
          candidateSteps.push({ x: enemy.pos.x + towardX, y: enemy.pos.y });
          candidateSteps.push({ x: enemy.pos.x, y: enemy.pos.y + towardY });
        } else {
          candidateSteps.push({ x: enemy.pos.x, y: enemy.pos.y + towardY });
          candidateSteps.push({ x: enemy.pos.x + towardX, y: enemy.pos.y });
        }
      }

      let acted = false;
      for (const next of candidateSteps) {
        if (!isWalkable(next)) continue;
        // попытка зайти на игрока трактуется как атака, без движения
        if (next.x === state.player.pos.x && next.y === state.player.pos.y) {
          state.player.hp -= enemy.attack;
          state.effects.push({ pos: { ...state.player.pos }, t: 120, color: "#ffd166" });
          if (state.player.hp <= 0) {
            state.uiOverlay = "Игра окончена";
            state.inputLocked = true;
            state.player.hp = MAX_HP;
          }
          acted = true;
          break;
        }
        if (state.enemies.some(other => other !== enemy && other.pos.x === next.x && other.pos.y === next.y)) continue;
        enemy.pos = next;
        acted = true;
        break;
      }
      if (!acted) {
        // пропуск хода
      }
    }
  });
}

function combatPhase() {}

function endPhase() {
  store.update(state => {
    if (state.enemies.length === 0) {
      state.uiOverlay = "Победа!";
      state.inputLocked = true;
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
  return { id: `e${++idCounter}`, pos, hp: 40, attack: 3, kind: "enemy" as const };
}

function spawnItem(kind: Item["kind"], value: number): Item {
  const pos = findEmpty();
  return { id: `i${++idCounter}`, pos, kind, value };
}

function spawnItemsExact() {
  store.update(state => {
    for (let i = 0; i < 10; i++) state.items.push(spawnItem("potion", 2));
    for (let i = 0; i < 2; i++) state.items.push(spawnItem("sword", 1));
  });
}

function spawnEnemiesExact() {
  store.update(s => {
    for (let i = 0; i < 10; i++) s.enemies.push(spawnEnemy());
  });
}
