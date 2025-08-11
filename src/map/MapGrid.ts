import type { Tile } from "@/core/types";

export class MapGrid {
  tiles: Tile[];
  constructor(public width: number, public height: number) {
    this.tiles = new Array<Tile>(width * height).fill("WALL");
  }

  idx(x: number, y: number) { return y * this.width + x; }
  isInside(x: number, y: number) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }

  get(x: number, y: number): Tile {
    if (!this.isInside(x, y)) return "WALL";
    // гарантируем возврат Tile при strict типах
    return this.tiles[this.idx(x, y)]!;
  }
  set(x: number, y: number, t: Tile) {
    if (!this.isInside(x, y)) return;
    this.tiles[this.idx(x, y)] = t;
  }

  carveRoom(x0: number, y0: number, x1: number, y1: number) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, "FLOOR");
  }

  carveCorridor(x0: number, y0: number, x1: number, y1: number) {
    // L-shaped corridor: horizontal then vertical
    const sx = Math.sign(x1 - x0) || 1;
    const sy = Math.sign(y1 - y0) || 1;
    for (let x = x0; x !== x1; x += sx) this.set(x, y0, "FLOOR");
    for (let y = y0; y !== y1; y += sy) this.set(x1, y, "FLOOR");
    this.set(x1, y1, "FLOOR");
  }
}
