export type SpriteMap = {
  wall?: HTMLImageElement;
  floor?: HTMLImageElement;
  player?: HTMLImageElement;
  enemy?: HTMLImageElement;
  potion?: HTMLImageElement;
  sword?: HTMLImageElement;
};

export const assets: SpriteMap = {};

const BASE: string = import.meta.env.BASE_URL ?? "./";
const prefix: string = BASE.endsWith("/") ? BASE : `${BASE}/`;
const sources: Record<keyof SpriteMap, string> = {
  wall: `${prefix}images/tile-W.png`,
  floor: `${prefix}images/tile-.png`,
  player: `${prefix}images/tile-P.png`,
  enemy: `${prefix}images/tile-E.png`,
  potion: `${prefix}images/tile-HP.png`,
  sword: `${prefix}images/tile-SW.png`
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
