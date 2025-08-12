export function mulberry32(seed: number) {
  let state32 = seed >>> 0;
  return () => {
    state32 += 0x6d2b79f5;
    let result = Math.imul(state32 ^ (state32 >>> 15), 1 | state32);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
