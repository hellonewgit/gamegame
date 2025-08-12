import { store } from "@/core/store";
import { MapGrid } from "@/map/MapGrid";
import type { Position, Item } from "@/core/types";
import { MAX_HP } from "@/core/constants";

let mapGrid: MapGrid;
let idCounter = 0;

export function initLevel() {
  const state = store.state;
  mapGrid = new MapGrid(state.width, state.height);
  const rand = (min: number, max: number) => Math.floor(store.rng() * (max - min + 1)) + min;
  type Room = { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number };
  const rooms: Room[] = [];

  const targetRooms = rand(5, 10);
  let attempts = 0;
  while (rooms.length < targetRooms && attempts < targetRooms * 20) {
    attempts++;
    const rw = rand(3, 8);
    const rh = rand(3, 8);
    const x0 = rand(1, Math.max(1, state.width - rw - 2));
    const y0 = rand(1, Math.max(1, state.height - rh - 2));
    const x1 = x0 + rw - 1;
    const y1 = y0 + rh - 1;
    const overlaps = rooms.some(room => !(x1 + 1 < room.x0 - 1 || x0 - 1 > room.x1 + 1 || y1 + 1 < room.y0 - 1 || y0 - 1 > room.y1 + 1));
    if (overlaps) continue;
    mapGrid.carveRoom(x0, y0, x1, y1);
    const cx = Math.floor((x0 + x1) / 2);
    const cy = Math.floor((y0 + y1) / 2);
    rooms.push({ x0, y0, x1, y1, cx, cy });
  }

  if (rooms.length < 3) {
    const roomWidth = Math.max(6, Math.floor(state.width / 3));
    const roomHeight = Math.max(6, Math.floor(state.height / 3));
    const x0 = Math.floor((state.width - roomWidth) / 2);
    const y0 = Math.floor((state.height - roomHeight) / 2);
    const x1 = x0 + roomWidth - 1;
    const y1 = y0 + roomHeight - 1;
    mapGrid.carveRoom(x0, y0, x1, y1);
    rooms.push({ x0, y0, x1, y1, cx: Math.floor((x0 + x1) / 2), cy: Math.floor((y0 + y1) / 2) });
  }

  rooms.sort((roomA, roomB) => roomA.cx - roomB.cx + (roomA.cy - roomB.cy));
  for (let i = 1; i < rooms.length; i++) {
    const roomA = rooms[i - 1]!; const roomB = rooms[i]!;
    mapGrid.carveCorridor(roomA.cx, roomA.cy, roomB.cx, roomB.cy);
  }

  const extra = Math.min(rooms.length, rand(2, 4));
  for (let i = 0; i < extra; i++) {
    const ai = rand(0, rooms.length - 1);
    const bi = rand(0, rooms.length - 1);
    if (ai === bi) continue;
    const roomA = rooms[ai]!; const roomB = rooms[bi]!;
    mapGrid.carveCorridor(roomA.cx, roomA.cy, roomB.cx, roomB.cy);
  }

  store.update(state => {
    state.map = mapGrid.tiles;
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
  const state = store.state;
  const intent = (state as any)._intent as { dx: number; dy: number } | undefined;
  const attack = (state as any)._attack as boolean | undefined;
  (state as any)._intent = undefined;
  (state as any)._attack = undefined;

  if (intent) {
    moveActor(state.player.pos, intent.dx, intent.dy);
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

function isWalkable(position: Position) {
  if (!store.isInside(position)) return false;
  const tile = store.state.map[store.idx(position.x, position.y)];
  return tile === "FLOOR";
}

function occupiedByEnemy(position: Position) {
  return store.state.enemies.find(enemy => enemy.pos.x === position.x && enemy.pos.y === position.y);
}

function moveActor(position: Position, dx: number, dy: number) {
  const next = { x: position.x + dx, y: position.y + dy };
  if (!isWalkable(next)) return;
  if (occupiedByEnemy(next)) return;

  store.update(state => { state.player.pos = next; });
  pickupPhase();
}

function pickupPhase() {
  store.update(state => {
    const index = state.items.findIndex(item => item.pos.x === state.player.pos.x && item.pos.y === state.player.pos.y);
    if (index >= 0) {
      const item = state.items[index]!;
      if (item.kind === "potion") state.player.hp = Math.min(MAX_HP, state.player.hp + item.value);
      if (item.kind === "sword") state.player.attack += item.value;
      state.items.splice(index, 1);
    }
  });
}

function aiPhase() {
  store.update(state => {
    for (const enemy of state.enemies) {
      const towardX = Math.sign(state.player.pos.x - enemy.pos.x);
      const towardY = Math.sign(state.player.pos.y - enemy.pos.y);

      const dx = Math.abs(state.player.pos.x - enemy.pos.x);
      const dy = Math.abs(state.player.pos.y - enemy.pos.y);
      const chebyshev = Math.max(dx, dy);
      // Если соседствует с игроком — атакует и НЕ двигается
      if (chebyshev <= 1) {
        state.player.hp -= enemy.attack;
        state.effects.push({ pos: { ...state.player.pos }, ttlMs: 120, color: "#ffd166" });
        if (state.player.hp <= 0) {
          state.uiOverlay = "Игра окончена";
          state.inputLocked = true;
          state.player.hp = MAX_HP;
        }
        continue;
      }

      const candidateSteps: Position[] = [];
      const randomStep = store.rng() < 0.3; // 30% — случайный сдвиг
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
          state.effects.push({ pos: { ...state.player.pos }, ttlMs: 120, color: "#ffd166" });
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
  store.update(state => {
    const px = state.player.pos.x, py = state.player.pos.y;
    const hit: typeof state.enemies = [];
    for (const dir of dirs) {
      const x = px + dir.x, y = py + dir.y;
      state.effects.push({ pos: { x, y }, ttlMs: 120, color: "#ffee58" });
      const target = state.enemies.find(enemy => enemy.pos.x === x && enemy.pos.y === y);
      if (target) hit.push(target);
    }
    for (const targetEnemy of hit) {
      targetEnemy.hp -= state.player.attack;
      if (targetEnemy.hp <= 0) state.enemies = state.enemies.filter(enemy => enemy !== targetEnemy);
    }
  });
}

function findEmpty(): Position {
  while (true) {
    const x = Math.floor(store.rng() * store.state.width);
    const y = Math.floor(store.rng() * store.state.height);
    if (mapGrid.get(x, y) === "FLOOR" && !occupiedByEnemy({ x, y })) return { x, y };
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
  store.update(state => {
    for (let i = 0; i < 10; i++) state.enemies.push(spawnEnemy());
  });
}
