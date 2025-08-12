export type Tile = "WALL" | "FLOOR";
export interface Position { x: number; y: number; }

export interface Actor {
  id: string;
  pos: Position;
  hp: number;
  attack: number;
  ai?: "dumb";
  kind: "player" | "enemy";
}

export interface Item {
  id: string;
  pos: Position;
  kind: "potion" | "sword";
  value: number;
}

export interface GameState {
  width: number;
  height: number;
  floor: number;
  map: Tile[];             // width*height
  player: Actor;
  enemies: Actor[];
  items: Item[];
  effects: Array<{ pos: Position; t: number; color: string }>; // кратко живут
  inputLocked: boolean;
  rngSeed: number;
  uiOverlay?: string; // текст оверлея вместо alert
}
