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

  store.update(st => {
    st.map = map.tiles;
    st.player.pos = findEmpty();
    st.enemies = [];
    st.items = [];
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
  store.update(s => {
    const i = s.items.findIndex(it => it.pos.x === s.player.pos.x && it.pos.y === s.player.pos.y);
    if (i >= 0) {
      const item = s.items[i]!;
      if (item.kind === "potion") s.player.hp = MAX_HP;
      if (item.kind === "gold") s.player.attack += 10;
      s.items.splice(i, 1);
    }
  });
}

function aiPhase() {
  store.update(s => {
    for (const e of s.enemies) {
      const dxTo = Math.sign(s.player.pos.x - e.pos.x);
      const dyTo = Math.sign(s.player.pos.y - e.pos.y);

      const cheb = Math.max(Math.abs(s.player.pos.x - e.pos.x), Math.abs(s.player.pos.y - e.pos.y));
      if (cheb <= 1) {
        s.player.hp -= e.attack;
        s.effects.push({ pos: { ...s.player.pos }, t: 120, color: "#ffd166" });
        if (s.player.hp <= 0) {
          alert("Game Over!");
          s.player.hp = MAX_HP;
        }
        continue;
      }

      const step = { x: e.pos.x, y: e.pos.y };
      if (store.rng() < 0.5) step.x += dxTo; else step.y += dyTo;

      if (!isWalkable(step)) continue;
      if (s.enemies.some(other => other !== e && other.pos.x === step.x && other.pos.y === step.y)) continue;
      if (step.x === s.player.pos.x && step.y === s.player.pos.y) continue;
      e.pos = step;
    }
  });
}

function combatPhase() {}

function endPhase() {
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
  return { id: `e${++idCounter}`, pos, hp: 40, attack: 3, kind: "enemy" as const };
}

function spawnItem(kind: Item["kind"], value: number): Item {
  const pos = findEmpty();
  return { id: `i${++idCounter}`, pos, kind, value };
}

function spawnItemsExact() {
  store.update(s => {
    for (let i = 0; i < 10; i++) s.items.push(spawnItem("potion", 1));
    for (let i = 0; i < 2; i++) s.items.push(spawnItem("gold", 1));
  });
}

function spawnEnemiesExact() {
  store.update(s => {
    for (let i = 0; i < 10; i++) s.enemies.push(spawnEnemy());
  });
}
