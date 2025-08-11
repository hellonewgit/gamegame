export type SpriteMap = {
  wall?: HTMLImageElement;
  floor?: HTMLImageElement;
  player?: HTMLImageElement;
  enemy?: HTMLImageElement;
  potion?: HTMLImageElement;
  gold?: HTMLImageElement;
};

export const assets: SpriteMap = {};

// Match filenames from https://github.com/b602op/game-rogalik/tree/main/images
// tile-W.png   -> wall
// tile-.png    -> floor
// tile-P.png   -> player
// tile-E.png   -> enemy
// tile-HP.png  -> potion
// tile-SW.png  -> gold (used for sword/loot placeholder)
const BASE = (import.meta as any).env?.BASE_URL ?? "./";
const prefix = BASE.endsWith("/") ? BASE : BASE + "/";
const sources: Record<keyof SpriteMap, string> = {
  wall: `${prefix}images/tile-W.png`,
  floor: `${prefix}images/tile-.png`,
  player: `${prefix}images/tile-P.png`,
  enemy: `${prefix}images/tile-E.png`,
  potion: `${prefix}images/tile-HP.png`,
  gold: `${prefix}images/tile-SW.png`
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export async function loadAssets() {
  const entries = Object.entries(sources) as [keyof SpriteMap, string][];
  await Promise.all(
    entries.map(async ([key, src]) => {
      try {
        const img = await loadImage(src);
        assets[key] = img;
      } catch {
        // silently fallback to primitives if missing
      }
    })
  );
}
